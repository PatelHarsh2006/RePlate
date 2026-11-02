
const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Donation = require("../models/Donation");
const User = require("../models/User");
const fetchuser = require("../middleware/fetchuser");

router.post(
  "/",
  fetchuser,
  [
    body("donorName").trim().notEmpty().withMessage("Donor name is required"),
    body("donorType").isIn(["household", "restaurant", "tiffin", "event", "other"]).withMessage("Invalid donor type"),
    body("foodType").isIn(["cooked-meals", "packaged", "fruits-vegetables", "bakery", "other"]).withMessage("Invalid food category"),
    body("foodQuantity").isFloat({ min: 1 }).withMessage("Quantity must be at least 1"),
    body("quantityUnit").isIn(["servings", "kg", "packets", "boxes"]).withMessage("Invalid quantity unit"),
    body("pickupAddress").trim().notEmpty().withMessage("Pickup address is required"),
    body("pickupLandmark").optional({ values: "falsy" }).trim(),
    body("pickupLocation.type").equals("Point").withMessage("Invalid pickup location type"),
    body("pickupLocation.coordinates").custom((coordinates) => {
      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new Error("Pickup coordinates must contain longitude and latitude");
      }

      const longitude = Number(coordinates[0]);
      const latitude = Number(coordinates[1]);

      if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
      ) {
        throw new Error("Invalid pickup coordinates");
      }

      return true;
    }),
    body("availabilityStart").custom((value) => {
      if (!value || Number.isNaN(new Date(value).getTime())) {
        throw new Error("A valid availability start time is required");
      }

      return true;
    }),
    body("availabilityEnd").custom((value, { req }) => {
      const start = new Date(req.body.availabilityStart);
      const end = new Date(value);

      if (!value || Number.isNaN(end.getTime())) {
        throw new Error("A valid availability end time is required");
      }

      if (Number.isNaN(start.getTime()) || end <= start) {
        throw new Error("Availability end must be after availability start");
      }

      return true;
    }),
    body("donorPhone").matches(/^[0-9+() -]{8,18}$/).withMessage("Enter a valid phone number"),
    body("foodNotes").optional({ values: "falsy" }).trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(401).json({ error: "User account not found" });
      }

      if (user.role !== "donor") {
        return res.status(403).json({ error: "Only donor accounts can submit donation requests" });
      }

      const {
        donorName,
        donorType,
        foodType,
        foodQuantity,
        quantityUnit,
        pickupAddress,
        pickupLandmark,
        pickupLocation,
        availabilityStart,
        availabilityEnd,
        donorPhone,
        foodNotes
      } = req.body;

      const donation = await Donation.create({
        donor: user._id,
        donorName,
        donorType,
        foodType,
        foodQuantity,
        quantityUnit,
        pickupAddress,
        pickupLandmark,
        pickupLocation: {
          type: "Point",
          coordinates: [
            Number(pickupLocation.coordinates[0]),
            Number(pickupLocation.coordinates[1])
          ]
        },
        availabilityStart: new Date(availabilityStart),
        availabilityEnd: new Date(availabilityEnd),
        donorPhone,
        foodNotes
      });

      res.status(201).json({
        success: true,
        message: "Donation request submitted successfully",
        donation
      });
    } catch (error) {
      console.error("Donation submission error:", error);
      res.status(500).json({ error: "Server error while submitting donation" });
    }
  }
);

router.get("/pending", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: "User account not found" });
    }

    if (user.role !== "volunteer") {
      return res.status(403).json({ error: "Only volunteers can view pending donations" });
    }

    const donations = await Donation.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("donor", "name email");

    res.json({ success: true, donations });
  } catch (error) {
    console.error("Pending donations error:", error);
    res.status(500).json({ error: "Server error while fetching donations" });
  }
});

router.post("/:id/accept", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: "User account not found" });
    }

    if (user.role !== "volunteer") {
      return res.status(403).json({ error: "Only volunteers can accept deliveries" });
    }

    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      {
        $set: {
          status: "accepted",
          deliveryVolunteer: user._id
        }
      },
      { new: true, runValidators: true }
    );

    if (!donation) {
      return res.status(409).json({ error: "This donation is no longer available" });
    }

    res.json({
      success: true,
      message: "Delivery accepted successfully",
      donation
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid donation ID" });
    }

    console.error("Donation acceptance error:", error);
    res.status(500).json({ error: "Server error while accepting delivery" });
  }
});

router.get("/mine/accepted", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: "User account not found" });
    }

    if (user.role !== "volunteer") {
      return res.status(403).json({ error: "Only volunteers can view their deliveries" });
    }

    const donations = await Donation.find({
      deliveryVolunteer: user._id,
      status: "accepted"
    }).sort({ updatedAt: -1 });

    res.json({ success: true, donations });
  } catch (error) {
    console.error("Accepted donations error:", error);
    res.status(500).json({ error: "Server error while fetching your deliveries" });
  }
});

router.get("/mine/completed", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ error: "User account not found" });
    }

    if (user.role !== "volunteer") {
      return res.status(403).json({ error: "Only volunteers can view completed deliveries" });
    }

    const donations = await Donation.find({
      deliveryVolunteer: user._id,
      status: "completed"
    }).sort({ updatedAt: -1 });

    res.json({ success: true, donations });
  } catch (error) {
    console.error("Completed donations error:", error);
    res.status(500).json({ error: "Server error while fetching completed deliveries" });
  }
});

module.exports = router;
