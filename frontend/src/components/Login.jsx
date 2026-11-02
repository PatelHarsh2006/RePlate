import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        const email = event.target.email.value;
        const password = event.target.password.value;

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.errors?.[0]?.msg || data.error || "Login failed.");
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

                <p className="auth-eyebrow">WELCOME BACK</p>
                <h1>Good to see you again.</h1>
                <p className="auth-description">
                    Log in to continue helping good food reach people in need.
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && <p role="alert">{error}</p>}

                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Log in"}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>

                <Link to="/" className="auth-home">← Back to homepage</Link>
            </section>
        </main>
    );
}

export default Login;