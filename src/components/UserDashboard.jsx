import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function UserDashboard() {
  const navigate = useNavigate();
  const [loginStatus, setLoginStatus] = useState("ready");
  const [isRobot, setIsRobot] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);

  const streamRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    // 🔥 GENERATE ONCE AND STORE
    let userId = sessionStorage.getItem("userId");
    if (!userId) {
      userId = `student_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("userId", userId);
    }
    userIdRef.current = userId;

    socket.on("connect", () => {
      console.log("✅ USER: Socket connected!", socket.id);
    });

    socket.emit("register-user", userId);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      socket.off();
    };
  }, []);

  const handleFaceLogin = async () => {
    if (isRobot) {
      alert("Please verify you're not a robot first!");
      return;
    }

    console.log("🔐 USER: Starting face login...");
    setLoginStatus("scanning");

    let progress = 0;
    const scanInterval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(scanInterval);
        setLoginStatus("authenticating");
        setTimeout(() => initiateActualLogin(), 500);
      }
    }, 200);
  };

  const initiateActualLogin = async () => {
    console.log("🎥 USER: Requesting camera access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      console.log("✅ USER: Camera access granted!");
      streamRef.current = stream;

      stream.getTracks().forEach((track) => track.stop());

      socket.emit("camera-permission-granted");

      setLoginStatus("success");

      setTimeout(() => {
        console.log("🚀 Redirecting to /student...");
        navigate("/student");
      }, 1500);
    } catch (error) {
      console.error("❌ USER: Camera access denied:", error);
      setLoginStatus("error");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.logoSection}>
            <div style={styles.logo}>🎓</div>
            <h1 style={styles.title}>SecureStream AI</h1>
            <p style={styles.subtitle}>Secure Online Examination Platform</p>
          </div>

          <div style={styles.divider}></div>

          {loginStatus === "ready" && (
            <>
              <div style={styles.verificationBox}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={!isRobot}
                    onChange={() => setIsRobot(!isRobot)}
                    style={styles.checkbox}
                  />
                  <span style={styles.checkboxText}>I'm not a robot</span>
                </label>
              </div>

              <button
                onClick={handleFaceLogin}
                style={{
                  ...styles.loginButton,
                  opacity: isRobot ? 0.5 : 1,
                  cursor: isRobot ? "not-allowed" : "pointer",
                }}
                disabled={isRobot}
              >
                <span style={styles.buttonIcon}>🔐</span>
                Login with Face Recognition
              </button>

              <p style={styles.infoText}>
                Biometric authentication ensures secure exam access
              </p>
            </>
          )}

          {loginStatus === "scanning" && (
            <div style={styles.scanningContainer}>
              <div style={styles.scanIcon}>👤</div>
              <h3 style={styles.scanTitle}>Scanning Face...</h3>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${scanProgress}%`,
                  }}
                ></div>
              </div>
              <p style={styles.scanText}>{scanProgress}% Complete</p>
            </div>
          )}

          {loginStatus === "authenticating" && (
            <div style={styles.scanningContainer}>
              <div style={styles.loadingSpinner}></div>
              <h3 style={styles.scanTitle}>Authenticating...</h3>
              <p style={styles.scanText}>Verifying identity</p>
            </div>
          )}

          {loginStatus === "success" && (
            <div style={styles.successContainer}>
              <div style={styles.successIcon}>✓</div>
              <h3 style={styles.successTitle}>Authentication Successful!</h3>
              <p style={styles.successText}>Redirecting to exam...</p>
            </div>
          )}

          {loginStatus === "error" && (
            <div style={styles.errorContainer}>
              <div style={styles.errorIcon}>✕</div>
              <h3 style={styles.errorTitle}>Authentication Failed</h3>
              <p style={styles.errorText}>
                Please allow camera access and try again
              </p>
              <button onClick={handleFaceLogin} style={styles.retryButton}>
                Retry
              </button>
            </div>
          )}
        </div>

        <p style={styles.footerText}>
          © 2025 SecureStream AI - All Rights Reserved
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  loginContainer: { width: "100%", maxWidth: "480px", padding: "20px" },
  loginCard: {
    background: "white",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logoSection: { textAlign: "center", marginBottom: "30px" },
  logo: { fontSize: "64px", marginBottom: "15px" },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 8px 0",
  },
  subtitle: { fontSize: "14px", color: "#666", margin: 0 },
  divider: { height: "1px", background: "#e0e0e0", margin: "25px 0" },
  verificationBox: {
    background: "#f8f9fa",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "25px",
    border: "2px solid #e0e0e0",
  },
  checkboxLabel: { display: "flex", alignItems: "center", cursor: "pointer" },
  checkbox: {
    width: "20px",
    height: "20px",
    marginRight: "12px",
    cursor: "pointer",
  },
  checkboxText: { fontSize: "16px", color: "#333" },
  loginButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  buttonIcon: { fontSize: "20px" },
  infoText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
    marginTop: "15px",
  },
  scanningContainer: { textAlign: "center", padding: "30px 0" },
  scanIcon: { fontSize: "80px", marginBottom: "20px" },
  scanTitle: { fontSize: "22px", color: "#333", margin: "0 0 20px 0" },
  progressBar: {
    width: "100%",
    height: "8px",
    background: "#e0e0e0",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "15px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    transition: "width 0.3s",
  },
  scanText: { fontSize: "14px", color: "#666" },
  loadingSpinner: {
    width: "60px",
    height: "60px",
    border: "4px solid #e0e0e0",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin 1s linear infinite",
  },
  successContainer: { textAlign: "center", padding: "30px 0" },
  successIcon: {
    width: "80px",
    height: "80px",
    background: "#4caf50",
    color: "white",
    fontSize: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  successTitle: { fontSize: "22px", color: "#4caf50", margin: "0 0 10px 0" },
  successText: { fontSize: "14px", color: "#666" },
  errorContainer: { textAlign: "center", padding: "30px 0" },
  errorIcon: {
    width: "80px",
    height: "80px",
    background: "#f44336",
    color: "white",
    fontSize: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  errorTitle: { fontSize: "22px", color: "#f44336", margin: "0 0 10px 0" },
  errorText: { fontSize: "14px", color: "#666", marginBottom: "20px" },
  retryButton: {
    padding: "12px 30px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  footerText: {
    textAlign: "center",
    color: "white",
    fontSize: "13px",
    marginTop: "20px",
    opacity: "0.8",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default UserDashboard;
