import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Signup() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const form = event.target;
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: form.name.value,
                    email: form.email.value,
                    role: form.role.value,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.errors?.[0]?.msg || data.error || "Signup failed.");
                return;
            }

            localStorage.setItem("auth-token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            const dashboardPaths = {
                donor: "/dashboard/donor",
                volunteer: "/dashboard/delivery",
                ngo: "/dashboard/ngo"
            };

            navigate(dashboardPaths[data.user.role] || "/");
        } catch {
            setError("Unable to connect to the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">
                <Link to="/" className="auth-brand">RePlate<span>.</span></Link>

                <p className="auth-eyebrow">JOIN THE COMMUNITY</p>
                <h1>Make a difference.</h1>
                <p className="auth-description">
                    Create your account and help surplus food reach those who need it.
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="signup-name">Full name</label>
                        <input
                            id="signup-name"
                            name="name"
                            type="text"
                            placeholder="Enter your full name"
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="signup-email">Email address</label>
                        <input
                            id="signup-email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="signup-role">I want to join as</label>
                        <select id="signup-role" name="role" defaultValue="" required>
                            <option value="" disabled>Select your role</option>
                            <option value="donor">Food donor</option>
                            <option value="volunteer">Delivery volunteer</option>
                            <option value="ngo">NGO representative</option>
                        </select>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="signup-password">Password</label>
                        <input
                            id="signup-password"
                            name="password"
                            type="password"
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            minLength="8"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="signup-confirm-password">Confirm password</label>
                        <input
                            id="signup-confirm-password"
                            name="confirmPassword"
                            type="password"
                            placeholder="Enter your password again"
                            autoComplete="new-password"
                            minLength="8"
                            required
                        />
                    </div>

                    {error && <p role="alert">{error}</p>}

                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>

                <Link to="/" className="auth-home">← Back to homepage</Link>
            </section>
        </main>
    );
}

export default Signup;