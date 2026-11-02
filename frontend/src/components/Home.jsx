
import { useState } from "react";
import "../index.css";
import bgLogo from "../assets/bg-logo.png"
import heroImg from "../assets/hero.png"

const steps = [
  {
    number: "01",
    title: "Share surplus food",
    description:
      "Homes, restaurants and tiffin services submit details about fresh, excess food ready for collection.",
  },
  {
    number: "02",
    title: "Smart collection",
    description:
      "Nearby requests are grouped into time-based batches to help volunteers collect food efficiently.",
  },
  {
    number: "03",
    title: "Deliver to an NGO",
    description:
      "Collected food reaches a suitable NGO that can distribute it to people who need it.",
  },
];

const features = [
  {
    icon: "🏠",
    title: "For households",
    description: "Share extra food from family meals and special occasions.",
    color: "peach",
  },
  {
    icon: "🍲",
    title: "For restaurants",
    description: "Give surplus meals a purpose instead of throwing them away.",
    color: "yellow",
  },
  {
    icon: "💚",
    title: "For NGOs",
    description: "Connect with nearby food donors and coordinate collections.",
    color: "green",
  },
  {
    icon: "🛵",
    title: "For volunteers",
    description: "Collect multiple nearby donations in one planned trip.",
    color: "blue",
  },
];

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);


  const [donationSubmitted, setDonationSubmitted] = useState(false);

  const handleDonationSubmit = (event) => {
    event.preventDefault();
    setDonationSubmitted(true);
  };


  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
    setMenuOpen(false);
  };

  const showNotice = () => {
    alert("Thanks for your interest in RePlate! Registration will be available soon.");
  };

  return (
    <div className="app">
      <main>
        <section className="hero section-container" id="home">
          <div className="hero-content">

            <h1>
              <span>From</span>
              <br />
              Plates with Plenty
              <br />
              <span>To</span>
              <br />
              Plates in Need
            </h1>

            <p className="hero-description">
              Every day, good food goes to waste while people go hungry.
              RePlate connects food donors, local volunteers and NGOs to
              make sure surplus food finds the people who need it.
            </p>

            <div className="hero-actions">
              <button
                className="button"
                onClick={() => scrollTo("donate-food")}
              >
                Be part of the change <span>→</span>
              </button>
              <button
                className="text-button"
                onClick={() => scrollTo("how-it-works")}
              >
                Discover how it works <span>↓</span>
              </button>
            </div>


          </div>

          <div className="hero-visual">

            <img className="hero-illustration" src={heroImg}>
            </img>
          </div>

        </section>

        <section className="impact-strip" id="our-mission">
          <div className="impact-inner">
            <div className="impact-intro">
              <span className="section-kicker">WHY REPLATE?</span>
              <h2>
                Small actions.
                <br />
                <span>Real change.</span>
              </h2>
            </div>

            <div className="impact-item">
              <span className="impact-symbol">♻</span>
              <h3>Less food waste</h3>
              <p>Give surplus food another purpose.</p>
            </div>

            <div className="impact-item">
              <span className="impact-symbol">♡</span>
              <h3>Stronger communities</h3>
              <p>Bring donors and local NGOs together.</p>
            </div>

            <div className="impact-item">
              <span className="impact-symbol">⌁</span>
              <h3>Smarter collections</h3>
              <p>Group nearby pickups into efficient routes.</p>
            </div>
          </div>
        </section>

        <section className="how-section section-container" id="how-it-works">
          <div className="section-heading">
            <span className="section-kicker">SIMPLE BY DESIGN</span>
            <h2>
              Three steps to
              <br />
              <span>make a difference.</span>
            </h2>
            <p>
              A simple process that brings surplus food and the people
              who need it closer together.
            </p>
          </div>

          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className="step-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="mission-banner">
          <div className="mission-inner">
            <div className="mission-art">
              <span className="mission-plate">🍽️</span>
              <span className="mission-heart">💚</span>
              <span className="mission-spark">✦</span>
            </div>
            <div className="mission-copy">
              <span className="section-kicker">A BETTER WAY FORWARD</span>
              <h2>
                The best meal is
                <br />
                one that <span>reaches everyone.</span>
              </h2>
              <p>
                We believe technology can help communities make better use
                of the food they already have. Less waste, better coordination,
                and more food reaching people.
              </p>
              <button
                className="button button-light"
                onClick={() => scrollTo("get-involved")}
              >
                Help make it happen <span>→</span>
              </button>
            </div>
          </div>
        </section>


        <section className="donate-section" id="donate-food">
          <div className="donate-layout">
            <div className="donate-info">
              <span className="section-kicker">DONATE WITH REPLATE</span>

              <h2>
                Your extra food.
                <br />
                <span>Someone's next meal.</span>
              </h2>

              <p className="donate-intro">
                Have fresh surplus food? Tell us what you have and where
                to collect it. RePlate will group eligible nearby requests
                into hourly collection batches.
              </p>

              <div className="pickup-timeline">
                <div className="timeline-item">
                  <span className="timeline-number">1</span>
                  <div>
                    <h3>Submit your donation</h3>
                    <p>
                      Enter the food quantity, pickup address and the time
                      it will be ready.
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <span className="timeline-number">2</span>
                  <div>
                    <h3>Next hourly dispatch</h3>
                    <p>
                      Eligible requests are grouped into batches. For example,
                      a request submitted between 10:00 and 10:59 may be
                      considered for the 11:00 dispatch.
                    </p>
                  </div>
                </div>

                <div className="timeline-item">
                  <span className="timeline-number">3</span>
                  <div>
                    <h3>Pickup and redistribution</h3>
                    <p>
                      A driver follows an efficient pickup route and takes
                      the collected food to a suitable participating NGO.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pickup-note">
                <span>ⓘ</span>
                <p>
                  <strong>About pickup timing:</strong> the hour shown is the
                  planned dispatch time, not a guaranteed arrival time.
                  Actual arrival depends on route planning, traffic and
                  whether the food is ready. Your confirmed pickup details
                  should be shared once the service is connected.
                </p>
              </div>
            </div>

            <div className="donate-form-card">
              <div className="donate-form-heading">
                <span className="form-icon">🥗</span>
                <div>
                  <h3>Food donation request</h3>
                  <p>Share a few details about your donation.</p>
                </div>
              </div>

              {donationSubmitted ? (
                <div className="donation-success">
                  <span className="success-icon">✓</span>
                  <h3>Thank you for sharing!</h3>
                  <p>
                    Your form has been completed in this demo. It has not
                    been sent to RePlate yet because the backend is not
                    connected.
                  </p>
                  <button
                    type="button"
                    className="button"
                    onClick={() => setDonationSubmitted(false)}
                  >
                    Submit another donation
                  </button>
                </div>
              ) : (
                <form
                  className="donate-form"
                  onSubmit={handleDonationSubmit}
                >
                  <div className="form-field">
                    <label htmlFor="donorName">Your name / business name *</label>
                    <input
                      id="donorName"
                      name="donorName"
                      type="text"
                      placeholder="e.g. Green Leaf Restaurant"
                      required
                    />
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
                      <input
                        id="foodQuantity"
                        name="foodQuantity"
                        type="number"
                        min="1"
                        placeholder="e.g. 25"
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="quantityUnit">Measured in *</label>
                      <select
                        id="quantityUnit"
                        name="quantityUnit"
                        required
                        defaultValue="servings"
                      >
                        <option value="servings">Servings / meals</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="packets">Packets</option>
                        <option value="boxes">Boxes</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="pickupAddress">Full pickup address *</label>
                    <textarea
                      id="pickupAddress"
                      name="pickupAddress"
                      rows="2"
                      placeholder="House / shop number, street, area, city"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="pickupLandmark">Nearby landmark</label>
                    <input
                      id="pickupLandmark"
                      name="pickupLandmark"
                      type="text"
                      placeholder="e.g. Near City Mall"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="donorPhone">Contact phone number *</label>
                    <input
                      id="donorPhone"
                      name="donorPhone"
                      type="tel"
                      inputMode="tel"
                      pattern="[0-9+() -]{8,18}"
                      placeholder="Your contact number"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="foodNotes">Additional details (optional)</label>
                    <textarea
                      id="foodNotes"
                      name="foodNotes"
                      rows="2"
                      placeholder="Food packaging, allergens or collection instructions"
                    />
                  </div>

                  <button className="button donate-submit" type="submit">
                    Submit donation request <span>→</span>
                  </button>

                </form>
              )}
            </div>
          </div>
        </section>


        <section className="involved-section section-container" id="get-involved">
          <div className="section-heading">
            <span className="section-kicker">THERE'S A PLACE FOR YOU</span>
            <h2>
              Good things happen
              <br />
              <span>when we work together.</span>
            </h2>
            <p>
              Whether you have food to share or time to give, you can be
              part of the solution.
            </p>
          </div>

          <div className="involved-grid">
            {features.map((feature) => (
              <article
                className={`involved-card ${feature.color}`}
                key={feature.title}
              >
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <button
                  className="feature-link"
                  onClick={showNotice}
                  aria-label={`Join RePlate ${feature.title}`}
                >
                  Get involved <span>↗</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <div className="cta-decoration cta-decoration-one" />
          <div className="cta-decoration cta-decoration-two" />
          <span className="section-kicker">LET'S MAKE IT COUNT</span>
          <h2>
            Don't waste good food.
            <br />
            <span>Share the good.</span>
          </h2>
          <p>
            Join a community that believes every meal has value
            and every small action matters.
          </p>
          <button className="button button-light" onClick={showNotice}>
            Join the RePlate community <span>→</span>
          </button>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <img className="brand-icon" src={bgLogo} alt="" />
          <span>RePlate<span className="brand-dot"></span></span>
        </a>

        <p>Giving surplus food a second chance.</p>

        <div className="footer-links">
          <a href="#how-it-works">How it works</a>
          <a href="#our-mission">Our mission</a>
          <a href="#get-involved">Get involved</a>
        </div>

        <span className="copyright">
          © {new Date().getFullYear()} RePlate. Made for a better tomorrow.
        </span>
      </footer>
    </div>
  );
}

export default Home;