import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import DonorDashboard from "./components/DonorDashboard";
import DeliveryDashboard from "./components/DeliveryDashboard";
import NGODashboard from "./components/NGODashboard";
import "./index.css";

const dashboardPaths = {
  donor: "/dashboard/donor",
  volunteer: "/dashboard/delivery",
  ngo: "/dashboard/ngo"
};

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function PublicRoute({ children }) {
  const user = getUser();

  if (user && dashboardPaths[user.role]) {
    return <Navigate to={dashboardPaths[user.role]} replace />;
  }

  return children;
}

function DashboardRoute({ role, children }) {
  const user = getUser();

  if (!localStorage.getItem("auth-token") || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={dashboardPaths[user.role] || "/"} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={ <PublicRoute> <Home /> </PublicRoute> } />
        <Route path="/login" element={ <PublicRoute> <Login /> </PublicRoute> } />
        <Route path="/signup" element={ <PublicRoute> <Signup /> </PublicRoute> } />
        <Route path="/dashboard/donor" element={ <DashboardRoute role="donor"> <DonorDashboard /> </DashboardRoute> } />
        <Route path="/dashboard/delivery" element={ <DashboardRoute role="volunteer"> <DeliveryDashboard /> </DashboardRoute> } />
        <Route path="/dashboard/ngo" element={ <DashboardRoute role="ngo"> <NGODashboard /> </DashboardRoute> } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;