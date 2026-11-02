import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import bgLogo from "../assets/bg-logo.png";
import "../index.css";
import { UserRound } from "lucide-react";

const dashboardPaths = {
  donor: "/dashboard/donor",
  volunteer: "/dashboard/delivery",
  ngo: "/dashboard/ngo"
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);

    try {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    } catch {
      setUser(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loggedIn = Boolean(localStorage.getItem("auth-token") && user && dashboardPaths[user.role]);
  const dashboardPath = dashboardPaths[user?.role];

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user");
    setUser(null);
    setAccountOpen(false);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link className="brand" to={loggedIn ? dashboardPath : "/"} aria-label="RePlate home" onClick={() => setMenuOpen(false)}>
        <img className="brand-icon" src={bgLogo} alt="" />
        <span>RePlate<span className="brand-dot"></span></span>
      </Link>

      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
        {menuOpen ? "✕" : "☰"}
      </button>

      <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
        {!loggedIn && (
          <>
            <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="/#our-mission" onClick={() => setMenuOpen(false)}>Our mission</a>
            <a href="/#get-involved" onClick={() => setMenuOpen(false)}>Get involved</a>
            <button className="nav-login" onClick={() => { setMenuOpen(false); navigate("/login"); }}>Log in</button>
            <button className="button button-small" onClick={() => { setMenuOpen(false); navigate("/signup"); }}>Join RePlate</button>
          </>
        )}

        {loggedIn && (
          <div className="account-menu" ref={accountRef}>
            <button className="account-trigger" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} aria-haspopup="true">
              <span className="account-icon"><UserRound size={18} strokeWidth={1.5} /></span>
              <span>{user.name}</span>
              <span className="account-chevron">{accountOpen ? "▲" : "▼"}</span>
            </button>

            {accountOpen && (
              <div className="account-dropdown">
                <div className="account-details">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <button className="account-dashboard" onClick={() => { setAccountOpen(false); setMenuOpen(false); navigate(dashboardPath); }}>My Dashboard</button>
                <button className="account-logout" onClick={handleLogout}>Log out</button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;