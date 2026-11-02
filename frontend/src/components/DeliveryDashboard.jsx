
import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Dashboard.css";

function DeliveryDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [pools, setPools] = useState([]);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState("");

  const getHeaders = () => ({
    "auth-token": localStorage.getItem("auth-token") || ""
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [poolResponse, tripResponse] = await Promise.all([
        fetch("http://localhost:5000/api/trips/pools", { headers: getHeaders() }),
        fetch("http://localhost:5000/api/trips/mine/active", { headers: getHeaders() })
      ]);

      const poolData = await poolResponse.json();
      const tripData = await tripResponse.json();

      if (!poolResponse.ok) throw new Error(poolData.error || "Unable to load donation pools.");
      if (!tripResponse.ok) throw new Error(tripData.error || "Unable to load your trips.");

      setPools(poolData);
      setTrips(tripData);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


const acceptPool = async pool => {
  setAcceptingId(pool.poolId);
  setError("");

  if (!navigator.geolocation) {
    setError("Your browser does not support location access.");
    setAcceptingId("");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async position => {
      try {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          throw new Error("Your browser returned invalid location coordinates.");
        }

        const response = await fetch("http://localhost:5000/api/trips/accept-pool", {
          method: "POST",
          headers: {
            ...getHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            donationIds: pool.donations.map(donation => donation._id),
            startLocation: [longitude, latitude]
          })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Unable to accept this pool.");

        await loadData();
      } catch (err) {
        setError(err.message || "Unable to accept this pool.");
      } finally {
        setAcceptingId("");
      }
    },
    error => {
      if (error.code === 1) {
        setError("Location permission denied. Allow location access for localhost:5173 in your browser settings, then try again.");
      } else if (error.code === 2) {
        setError("Your current location is unavailable. Check that your device location services are enabled.");
      } else if (error.code === 3) {
        setError("Location request timed out. Please try again.");
      } else {
        setError(`Location error: ${error.message}`);
      }

      console.log("Geolocation error:", error.code, error.message);
      setAcceptingId("");
    },
    {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 60000
    }
  );
};


  const activeTrip = trips[0] || null;

  useEffect(() => {
    if (!activeTrip || !mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView([22.9734, 78.6569], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const start = activeTrip.startLocation?.coordinates;
    const points = [];

    if (start && start.length === 2) {
      points.push([start[1], start[0]]);
      L.marker([start[1], start[0]]).addTo(map).bindPopup("Volunteer starting location");
    }

    (activeTrip.donations || []).forEach((donation, index) => {
      const coordinates = donation.pickupLocation?.coordinates;

      if (coordinates?.length === 2) {
        const point = [coordinates[1], coordinates[0]];
        points.push(point);

        L.marker(point, {
          icon: L.divIcon({
            className: "replate-stop-marker",
            html: `<div>${index + 1}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map).bindPopup(
          `<strong>Pickup ${index + 1}</strong><br>${donation.donorName || "Donor"}<br>${donation.pickupAddress || ""}`
        );
      }
    });

    const geometry = activeTrip.routeGeometry?.coordinates || [];

    if (geometry.length > 1) {
      const routePoints = geometry.map(point => [point[1], point[0]]);
      L.polyline(routePoints, { color: "#247346", weight: 5 }).addTo(map);
    } else if (points.length > 1) {
      L.polyline(points, {
        color: "#247346",
        weight: 4,
        dashArray: "8 8"
      }).addTo(map);
    }

    if (points.length > 0) {
      map.fitBounds(points, { padding: [35, 35] });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [activeTrip]);

  const renderDonation = donation => (
    <article className="dashboard-card" key={donation._id}>
      <span className="dashboard-icon">🍲</span>
      <h2>{donation.donorName}</h2>
      <p><strong>Food:</strong> {donation.foodType}</p>
      <p><strong>Quantity:</strong> {donation.foodQuantity} {donation.quantityUnit}</p>
      <p><strong>Pickup address:</strong> {donation.pickupAddress}</p>
      {donation.pickupLandmark && <p><strong>Landmark:</strong> {donation.pickupLandmark}</p>}
      <p><strong>Contact:</strong> {donation.donorPhone}</p>
      {donation.foodNotes && <p><strong>Details:</strong> {donation.foodNotes}</p>}
    </article>
  );

  return (
    <main className="dashboard-page">
      <section className="dashboard-welcome">
        <p className="dashboard-greeting">Welcome back, {user.name || "Volunteer"}!</p>
      </section>

      {error && <p className="donation-error" role="alert">{error}</p>}

      <section className="delivery-section">
        <h2>Available Pickup Pools</h2>
        <h3>Donations grouped by availability hour.</h3>

        {loading ? (
          <p className="dashboard-note">Loading pools...</p>
        ) : pools.length === 0 ? (
          <p className="dashboard-note">No available donation pools right now.</p>
        ) : (
          <div className="dashboard-grid">
            {pools.map(pool => (
              <article className="dashboard-card" key={pool.poolId}>
                <span className="dashboard-icon">📦</span>
                <h2>{pool.donationCount} donations</h2>
                <p><strong>Available from:</strong> {new Date(pool.availabilityStart).toLocaleString()}</p>
                <p><strong>Pool window ends:</strong> {new Date(pool.availabilityEnd).toLocaleString()}</p>
                <p><strong>Total quantity:</strong> {pool.totalQuantity}</p>
                <div className="pool-donation-list">
                  {pool.donations.map(donation => (
                    <div key={donation._id}>
                      <strong>{donation.donorName}</strong>
                      <p>{donation.foodType} · {donation.foodQuantity} {donation.quantityUnit}</p>
                      <p>{donation.pickupAddress}</p>
                    </div>
                  ))}
                </div>
                <button className="button donate-submit" type="button" disabled={acceptingId === pool.poolId} onClick={() => acceptPool(pool)}>
                  {acceptingId === pool.poolId ? "Creating route..." : "Accept entire pool"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="delivery-section">
        <h2>My Active Pickup Route</h2>
        <h3>Your accepted donations and optimized pickup sequence.</h3>

        {!activeTrip ? (
          <p className="dashboard-note">You do not have an active pickup route yet.</p>
        ) : (
          <>
            <div className="trip-summary">
              <p><strong>Total road distance:</strong> {activeTrip.totalDistance.toFixed(2)} km</p>
              <p><strong>Estimated travel time:</strong> {activeTrip.estimatedDuration.toFixed(1)} minutes</p>
              <p><strong>Route calculation:</strong> {activeTrip.routeSource === "OSRM" ? "OSRM road route" : "Approximate fallback estimate"}</p>
              {activeTrip.routeSource === "fallback" && <p className="dashboard-note">The dashed line is an approximate connection between stops, not a road route.</p>}
            </div>

            <div ref={mapContainerRef} className="replate-map trip-map" />

            <h3>Pickup sequence</h3>
            <div className="dashboard-grid">
              {(activeTrip.donations || []).map((donation, index) => (
                <article className="dashboard-card" key={donation._id}>
                  <span className="dashboard-icon">{index + 1}</span>
                  <h2>{donation.donorName}</h2>
                  <p><strong>Food:</strong> {donation.foodType}</p>
                  <p><strong>Quantity:</strong> {donation.foodQuantity} {donation.quantityUnit}</p>
                  <p><strong>Pickup:</strong> {donation.pickupAddress}</p>
                  {donation.pickupLandmark && <p><strong>Landmark:</strong> {donation.pickupLandmark}</p>}
                  <p><strong>Contact:</strong> {donation.donorPhone}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <button className="button location-button" type="button" onClick={loadData}>Refresh pools and trips</button>
    </main>
  );
}

export default DeliveryDashboard;
