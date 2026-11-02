
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const fetchuser = require("../middleware/fetchuser");
const User = require("../models/User");
const Donation = require("../models/Donation");
const Trip = require("../models/Trip");

const {
  getDistanceMatrix,
  optimizeRoute,
  getRouteGeometry
} = require("../services/routeOptimizer");

const isValidCoordinates = (coordinates) => {
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    Number.isFinite(coordinates[0]) &&
    Number.isFinite(coordinates[1]) &&
    coordinates[0] >= -180 &&
    coordinates[0] <= 180 &&
    coordinates[1] >= -90 &&
    coordinates[1] <= 90
  );
};

const getVolunteer = async (req, res) => {
  const volunteer = await User.findById(req.user.id).select("name email role");

  if (!volunteer || volunteer.role !== "volunteer") {
    res.status(403).json({ error: "Only volunteers can access this route" });
    return null;
  }

  return volunteer;
};

const getHourStart = (date) => {
  const hourStart = new Date(date);
  hourStart.setUTCMinutes(0, 0, 0);
  return hourStart;
};

const getHourEnd = (date) => {
  const hourEnd = getHourStart(date);
  hourEnd.setUTCHours(hourEnd.getUTCHours() + 1);
  return hourEnd;
};

const getRouteDuration = (route, durations) => {
  let total = 0;

  for (let i = 0; i < route.length - 1; i++) {
    total += durations[route[i]][route[i + 1]];
  }

  return total;
};

const releaseDonations = async (donationIds, volunteerId) => {
  await Donation.updateMany(
    {
      _id: { $in: donationIds },
      status: "accepted",
      deliveryVolunteer: volunteerId
    },
    {
      $set: {
        status: "pending",
        deliveryVolunteer: null
      }
    }
  );
};

router.get("/pools", fetchuser, async (req, res) => {
  try {
    const volunteer = await getVolunteer(req, res);

    if (!volunteer) return;

    const now = new Date();

    const donations = await Donation.find({
      status: "pending",
      availabilityEnd: { $gt: now },
      "pickupLocation.type": "Point"
    })
      .populate("donor", "name email")
      .sort({ availabilityStart: 1 });

    const pools = new Map();

    for (const donation of donations) {
      if (
        !donation.pickupLocation ||
        !isValidCoordinates(donation.pickupLocation.coordinates) ||
        !donation.availabilityStart ||
        !donation.availabilityEnd
      ) {
        continue;
      }

      const start = getHourStart(donation.availabilityStart);
      const end = getHourEnd(donation.availabilityStart);

      if (donation.availabilityEnd <= start) continue;

      const poolStart = start.toISOString();
      const poolEnd = end.toISOString();
      const key = `${poolStart}_${poolEnd}`;

      if (!pools.has(key)) {
        pools.set(key, {
          poolId: key,
          availabilityStart: poolStart,
          availabilityEnd: poolEnd,
          donations: []
        });
      }

      pools.get(key).donations.push(donation);
    }

    const result = Array.from(pools.values()).map(pool => ({
      ...pool,
      donationCount: pool.donations.length,
      totalQuantity: pool.donations.reduce(
        (total, donation) => total + donation.foodQuantity,
        0
      )
    }));

    return res.json(result);
  } catch (error) {
    console.error("Pool fetch error:", error.message);
    return res.status(500).json({ error: "Unable to fetch donation pools" });
  }
});

router.post("/accept-pool", fetchuser, async (req, res) => {
  let claimedDonationIds = [];
  let createdTripId = null;

  try {
    const volunteer = await getVolunteer(req, res);

    if (!volunteer) return;

    const { donationIds, startLocation } = req.body;

    if (
      !Array.isArray(donationIds) ||
      donationIds.length === 0 ||
      donationIds.length > 15
    ) {
      return res.status(400).json({
        error: "Select between 1 and 15 donations"
      });
    }

    if (
      donationIds.some(id => !mongoose.Types.ObjectId.isValid(id)) ||
      new Set(donationIds.map(String)).size !== donationIds.length
    ) {
      return res.status(400).json({
        error: "Invalid or duplicate donation IDs"
      });
    }

    if (!isValidCoordinates(startLocation)) {
      return res.status(400).json({
        error: "Valid starting coordinates [longitude, latitude] are required"
      });
    }

    const donations = await Donation.find({
      _id: { $in: donationIds },
      status: "pending",
      availabilityEnd: { $gt: new Date() },
      "pickupLocation.type": "Point"
    });

    if (donations.length !== donationIds.length) {
      return res.status(409).json({
        error: "Some donations are unavailable or no longer pending"
      });
    }

    const firstDonation = donations[0];
    const poolStart = getHourStart(firstDonation.availabilityStart);
    const poolEnd = getHourEnd(firstDonation.availabilityStart);

    const samePool = donations.every(donation => {
      const donationStart = getHourStart(donation.availabilityStart);

      return (
        donationStart.getTime() === poolStart.getTime() &&
        donation.availabilityEnd > poolStart
      );
    });

    if (!samePool) {
      return res.status(400).json({
        error: "All selected donations must belong to the same availability hour"
      });
    }

    const coordinates = [
      startLocation,
      ...donations.map(donation => donation.pickupLocation.coordinates)
    ];

    const matrix = await getDistanceMatrix(coordinates);

    const hasCompleteMatrix =
      matrix.distances.length === coordinates.length &&
      matrix.durations.length === coordinates.length &&
      matrix.distances.every(row =>
        Array.isArray(row) &&
        row.length === coordinates.length &&
        row.every(Number.isFinite)
      ) &&
      matrix.durations.every(row =>
        Array.isArray(row) &&
        row.length === coordinates.length &&
        row.every(Number.isFinite)
      );

    if (!hasCompleteMatrix) {
      return res.status(503).json({
        error: "A complete route distance matrix could not be calculated. Please try again."
      });
    }

    const optimized = optimizeRoute(matrix.distances);

    const optimizedDonations = optimized.optimizedRoute
      .slice(1)
      .map(index => donations[index - 1]);

    const orderedCoordinates = optimized.optimizedRoute
      .map(index => coordinates[index]);

    const totalDistance = optimized.totalDistance / 1000;
    const estimatedDuration =
      getRouteDuration(optimized.optimizedRoute, matrix.durations) / 60;

    let routeGeometry = {
      type: "LineString",
      coordinates: []
    };

    if (matrix.source === "OSRM") {
      try {
        const routeResult = await getRouteGeometry(orderedCoordinates);

        routeGeometry = routeResult.geometry;
      } catch (error) {
        console.error("OSRM route geometry unavailable:", error.message);
      }
    }

    for (const donation of donations) {
      const claimed = await Donation.findOneAndUpdate(
        {
          _id: donation._id,
          status: "pending",
          deliveryVolunteer: null
        },
        {
          $set: {
            status: "accepted",
            deliveryVolunteer: volunteer._id
          }
        },
        { new: true }
      );

      if (!claimed) {
        await releaseDonations(claimedDonationIds, volunteer._id);

        return res.status(409).json({
          error: "Another volunteer has already accepted one or more donations. Refresh the pools and try again."
        });
      }

      claimedDonationIds.push(claimed._id);
    }

    const trip = await Trip.create({
      volunteer: volunteer._id,
      donations: optimizedDonations.map(donation => donation._id),
      startLocation: {
        type: "Point",
        coordinates: startLocation
      },
      optimizedOrder: optimizedDonations.map(donation => donation._id),
      routeGeometry,
      totalDistance,
      estimatedDuration,
      routeSource: matrix.source
    });

    createdTripId = trip._id;

    const populatedTrip = await Trip.findById(trip._id)
      .populate("volunteer", "name email")
      .populate({
        path: "donations",
        populate: {
          path: "donor",
          select: "name email"
        }
      });

    return res.status(201).json({
      message: "Donation pool accepted and route created successfully",
      trip: populatedTrip,
      route: {
        distanceKm: Number(totalDistance.toFixed(2)),
        estimatedMinutes: Number(estimatedDuration.toFixed(1)),
        source: matrix.source,
        geometryAvailable: routeGeometry.coordinates.length > 0
      }
    });
  } catch (error) {
  try {
    if (createdTripId) {
      await Trip.findByIdAndDelete(createdTripId);
    }

    if (claimedDonationIds.length > 0) {
      await releaseDonations(claimedDonationIds, req.user.id);
    }
  } catch (cleanupError) {
    console.error("Pool cleanup error:", cleanupError.message);
  }

  console.error("Pool acceptance error:", error.message);

  return res.status(500).json({
    error: "Unable to accept the donation pool"
  });
}
});

router.get("/mine/active", fetchuser, async (req, res) => {
  try {
    const volunteer = await getVolunteer(req, res);

    if (!volunteer) return;

    const trips = await Trip.find({
      volunteer: volunteer._id,
      status: "active"
    })
      .populate({
        path: "donations",
        populate: {
          path: "donor",
          select: "name email"
        }
      })
      .sort({ acceptedAt: -1 });

    return res.json(trips);
  } catch (error) {
    console.error("Active trips error:", error.message);
    return res.status(500).json({ error: "Unable to fetch active trips" });
  }
});

module.exports = router;
