import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import LandingPage from "./components/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <div style={styles.nav}>
        <Link to="/user" style={styles.link}>
          User Dashboard
        </Link>
        <Link to="/admin" style={styles.link}>
          Admin Dashboard
        </Link>
      </div>
      <Routes>
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Camera Security Awareness Demo</h1>
      <p>Choose a role to see how camera access works</p>
    </div>
  );
}

const styles = {
  nav: { background: "#333", padding: "15px", display: "flex", gap: "20px" },
  link: { color: "white", textDecoration: "none", fontSize: "18px" },
};

export default App;
