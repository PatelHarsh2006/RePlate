import "./Dashboard.css";

function NGODashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <main className="dashboard-page">
      <section className="dashboard-welcome">
        <h1>Welcome, {user.name || "NGO Representative"}!</h1>
        <p>Connect available food donations with your community's needs.</p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <span className="dashboard-icon">🥗</span>
          <h2>Available Food</h2>
          <p>Explore food donations available for your organisation.</p>
          <p className="dashboard-note">Available food listings will appear here.</p>
        </article>

        {/* <article className="dashboard-card">
          <span className="dashboard-icon">📝</span>
          <h2>My Requests</h2>
          <p>Keep track of the food donations your NGO requests.</p>
          <p className="dashboard-note">Your requests will appear here.</p>
        </article>

        <article className="dashboard-card">
          <span className="dashboard-icon">🤝</span>
          <h2>Community Impact</h2>
          <p>Help coordinate food support for people in need.</p>
          <p className="dashboard-note">Your organisation's impact will appear here.</p>
        </article> */}
      </section>
    </main>
  );
}

export default NGODashboard;