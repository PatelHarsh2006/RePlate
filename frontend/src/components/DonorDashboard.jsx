
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Dashboard.css";

function DonorDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([22.9734, 78.6569], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on("click", event => {
      const coordinates = [event.latlng.lng, event.latlng.lat];
      setPickupLocation(coordinates);

      if (markerRef.current) {
        markerRef.current.setLatLng(event.latlng);
      } else {
        markerRef.current = L.marker(event.latlng).addTo(map);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const useCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const coordinates = [longitude, latitude];

        setPickupLocation(coordinates);

        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);

          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
          }
        }
      },
      () => setError("Unable to get your location. Allow location access or select a point on the map."),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleDonationSubmit = async event => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!pickupLocation) {
      setError("Please select the exact pickup location on the map.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const donation = Object.fromEntries(formData.entries());

    if (new Date(donation.availabilityEnd) <= new Date(donation.availabilityStart)) {
      setError("Availability end must be after availability start.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("auth-token") || ""
        },
        body: JSON.stringify({
          ...donation,
          foodQuantity: Number(donation.foodQuantity),
          pickupLocation: {
            type: "Point",
            coordinates: pickupLocation
          },
          availabilityStart: new Date(donation.availabilityStart).toISOString(),
          availabilityEnd: new Date(donation.availabilityEnd).toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.errors?.[0]?.msg || "Unable to submit your donation.");
        return;
      }

      setSuccess("Your donation request has been submitted successfully.");
      form.reset();
      setPickupLocation(null);

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard-page">
      <section className="dashboard-welcome">
        <p className="dashboard-greeting">Welcome back, {user.name || "Donor"}!</p>
      </section>

      <section className="donate-section" id="donate-food">
        <div className="donate-layout">
          <div className="donate-info">
            <span className="section-kicker">DONATE WITH REPLATE</span>
            <h2>Your extra food.<br /><span>Someone's next meal.</span></h2>
            <p className="donate-intro">Share your surplus food, select its exact pickup location and tell volunteers when it will be ready.</p>
            <div className="pickup-timeline">
              <div className="timeline-item"><span className="timeline-number">1</span><div><h3>Submit your donation</h3><p>Enter your food details and select the pickup point.</p></div></div>
              <div className="timeline-item"><span className="timeline-number">2</span><div><h3>Wait for a volunteer</h3><p>Your donation joins its availability-hour pool.</p></div></div>
              <div className="timeline-item"><span className="timeline-number">3</span><div><h3>Food gets collected</h3><p>A volunteer follows an optimized pickup route.</p></div></div>
            </div>
          </div>

          <div className="donate-form-card">
            <div className="donate-form-heading">
              <span className="form-icon">🥗</span>
              <div><h3>Food donation request</h3><p>Share a few details about your donation.</p></div>
            </div>

            {success && <div className="donation-success"><span className="success-icon">✓</span><h3>Thank you for sharing!</h3><p>{success}</p></div>}
            {error && <p className="donation-error" role="alert">{error}</p>}

            <form className="donate-form" onSubmit={handleDonationSubmit}>
              <div className="form-field">
                <label htmlFor="donorName">Your name / business name *</label>
                <input id="donorName" name="donorName" type="text" defaultValue={user.name || ""} required />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="donorType">Donor type *</label>
                  <select id="donorType" name="donorType" required defaultValue="">
                    <option value="" disabled>Select type</option>
                    <option value="household">Household</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="tiffin">Tiffin service</option>
                    <option value="event">Event / catering</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="foodType">Food category *</label>
                  <select id="foodType" name="foodType" required defaultValue="">
                    <option value="" disabled>Select food</option>
                    <option value="cooked-meals">Cooked meals</option>
                    <option value="packaged">Packaged food</option>
                    <option value="fruits-vegetables">Fruits & vegetables</option>
                    <option value="bakery">Bakery items</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="foodQuantity">Quantity *</label>
                  <input id="foodQuantity" name="foodQuantity" type="number" min="1" required />
                </div>
                <div className="form-field">
                  <label htmlFor="quantityUnit">Measured in *</label>
                  <select id="quantityUnit" name="quantityUnit" required defaultValue="servings">
                    <option value="servings">Servings / meals</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="packets">Packets</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="pickupAddress">Full pickup address *</label>
                <textarea id="pickupAddress" name="pickupAddress" rows="2" placeholder="House / shop number, street, area, city" required />
              </div>

              <div className="form-field">
                <label htmlFor="pickupLandmark">Nearby landmark</label>
                <input id="pickupLandmark" name="pickupLandmark" type="text" placeholder="Near City Mall" />
              </div>

              <div className="form-field">
                <label>Exact pickup point *</label>
                <button type="button" className="button location-button" onClick={useCurrentLocation}>Use my current location</button>
                <p className="dashboard-note">Or click directly on the map to place the pickup marker.</p>
                <div ref={mapContainerRef} className="replate-map donor-map" />
                <p className="dashboard-note">{pickupLocation ? `Selected: ${pickupLocation[1].toFixed(6)}, ${pickupLocation[0].toFixed(6)}` : "No pickup point selected yet."}</p>
              </div>

              <div className="form-field">
                <label htmlFor="availabilityStart">Food available from *</label>
                <input id="availabilityStart" name="availabilityStart" type="datetime-local" min={new Date().toISOString().slice(0, 16)} required />
              </div>

              <div className="form-field">
                <label htmlFor="availabilityEnd">Food available until *</label>
                <input id="availabilityEnd" name="availabilityEnd" type="datetime-local" required />
              </div>

              <div className="form-field">
                <label htmlFor="donorPhone">Contact phone number *</label>
                <input id="donorPhone" name="donorPhone" type="tel" pattern="[0-9+() -]{8,18}" required />
              </div>

              <div className="form-field">
                <label htmlFor="foodNotes">Additional details (optional)</label>
                <textarea id="foodNotes" name="foodNotes" rows="2" placeholder="Packaging, allergens or collection instructions" />
              </div>

              <button className="button donate-submit" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit donation request"} <span>→</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default DonorDashboard;
