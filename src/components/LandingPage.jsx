import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.logoLarge}>🎓</div>
          <h1 style={styles.mainTitle}>SecureStream AI</h1>
          <p style={styles.tagline}>
            AI-Powered Online Exam Proctoring Platform
          </p>
          <p style={styles.description}>
            Monitor exams in real-time with facial recognition, live location
            tracking, and intelligent cheating detection.
          </p>

          <div style={styles.demoButtons}>
            <div style={styles.demoCard}>
              <div style={styles.demoIcon}>👨‍🎓</div>
              <h3 style={styles.demoTitle}>Student Demo</h3>
              <p style={styles.demoDesc}>Experience the exam interface</p>
              <div style={styles.credentials}>
                <div style={styles.credLabel}>No login required</div>
                <div style={styles.credValue}>Just click to access</div>
              </div>
              <button
                onClick={() => navigate("/user")}
                style={styles.primaryButton}
              >
                Launch Student Portal →
              </button>
            </div>

            <div style={styles.demoCard}>
              <div style={styles.demoIcon}>👨‍🏫</div>
              <h3 style={styles.demoTitle}>Teacher Demo</h3>
              <p style={styles.demoDesc}>Monitor students in real-time</p>
              <div style={styles.credentials}>
                <div style={styles.credLabel}>No login required</div>
                <div style={styles.credValue}>Just click to access</div>
              </div>
              <button
                onClick={() => navigate("/admin")}
                style={styles.secondaryButton}
              >
                Launch Proctor Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>🚀 Key Features</h2>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🎥</div>
            <h3 style={styles.featureTitle}>Live Video Monitoring</h3>
            <p style={styles.featureDesc}>
              Real-time camera streaming with WebRTC technology. Teachers can
              view student's exam environment live.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🗺️</div>
            <h3 style={styles.featureTitle}>GPS Location Tracking</h3>
            <p style={styles.featureDesc}>
              Interactive map showing student's real-time location with movement
              trail and distance tracking.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔐</div>
            <h3 style={styles.featureTitle}>Face Recognition Login</h3>
            <p style={styles.featureDesc}>
              Biometric authentication ensures only authorized students can
              access exams.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🚨</div>
            <h3 style={styles.featureTitle}>Instant Alerts</h3>
            <p style={styles.featureDesc}>
              Send real-time warnings to students during suspicious activity or
              policy violations.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📊</div>
            <h3 style={styles.featureTitle}>Analytics Dashboard</h3>
            <p style={styles.featureDesc}>
              Comprehensive monitoring with live statistics, active sessions,
              and student status.
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔒</div>
            <h3 style={styles.featureTitle}>Secure & Private</h3>
            <p style={styles.featureDesc}>
              End-to-end encrypted video streams and secure WebSocket
              communication.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div style={styles.techSection}>
        <h2 style={styles.sectionTitle}>⚡ Tech Stack</h2>
        <div style={styles.techGrid}>
          <div style={styles.techItem}>
            <div style={styles.techBadge}>React</div>
          </div>
          <div style={styles.techItem}>
            <div style={styles.techBadge}>Node.js</div>
          </div>
          <div style={styles.techItem}>
            <div style={styles.techBadge}>WebRTC</div>
          </div>
          <div style={styles.techItem}>
            <div style={styles.techBadge}>Socket.IO</div>
          </div>
          <div style={styles.techItem}>
            <div style={styles.techBadge}>Leaflet Maps</div>
          </div>
          <div style={styles.techItem}>
            <div style={styles.techBadge}>Express</div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={styles.statsSection}>
        <div style={styles.statBox}>
          <div style={styles.statNumber}>100+</div>
          <div style={styles.statLabel}>Students Monitored</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statNumber}>&lt;2s</div>
          <div style={styles.statLabel}>Video Latency</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statNumber}>99.2%</div>
          <div style={styles.statLabel}>Uptime</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statNumber}>Real-time</div>
          <div style={styles.statLabel}>Location Updates</div>
        </div>
      </div>

      {/* How It Works */}
      <div style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>📋 How It Works</h2>
        <div style={styles.stepsGrid}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Student Logs In</h3>
            <p style={styles.stepDesc}>
              Face recognition authentication with "I'm not a robot"
              verification
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Camera Activates</h3>
            <p style={styles.stepDesc}>
              Browser requests camera permission - student allows access
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Silent Monitoring</h3>
            <p style={styles.stepDesc}>
              Video streams to teacher dashboard without student preview
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>4</div>
            <h3 style={styles.stepTitle}>Live Tracking</h3>
            <p style={styles.stepDesc}>
              GPS location updates on interactive map in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          © 2025 SecureStream AI - Built with React, Node.js & WebRTC
        </p>
        <p style={styles.footerSubtext}>
          Educational project demonstrating proctoring technology
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f5f7fa",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  hero: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "80px 20px",
    textAlign: "center",
  },
  heroContent: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  logoLarge: {
    fontSize: "80px",
    marginBottom: "20px",
  },
  mainTitle: {
    fontSize: "56px",
    fontWeight: "700",
    margin: "0 0 20px 0",
  },
  tagline: {
    fontSize: "24px",
    marginBottom: "15px",
    opacity: 0.95,
  },
  description: {
    fontSize: "18px",
    maxWidth: "700px",
    margin: "0 auto 50px",
    lineHeight: "1.6",
    opacity: 0.9,
  },
  demoButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  demoCard: {
    background: "white",
    color: "#333",
    padding: "40px 30px",
    borderRadius: "20px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  },
  demoIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },
  demoTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  demoDesc: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "20px",
  },
  credentials: {
    background: "#f8f9fa",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  credLabel: {
    fontSize: "12px",
    color: "#666",
    marginBottom: "5px",
  },
  credValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#667eea",
  },
  primaryButton: {
    width: "100%",
    padding: "15px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  secondaryButton: {
    width: "100%",
    padding: "15px",
    background: "#4caf50",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  featuresSection: {
    padding: "80px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  sectionTitle: {
    fontSize: "36px",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "50px",
    color: "#1a1a1a",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
  },
  featureCard: {
    background: "white",
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    transition: "transform 0.3s",
  },
  featureIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },
  featureTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#333",
  },
  featureDesc: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
  },
  techSection: {
    padding: "60px 20px",
    background: "white",
  },
  techGrid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "20px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  techItem: {
    display: "inline-block",
  },
  techBadge: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    borderRadius: "25px",
    fontSize: "14px",
    fontWeight: "600",
  },
  statsSection: {
    padding: "60px 20px",
    background: "#667eea",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  statBox: {
    textAlign: "center",
    color: "white",
  },
  statNumber: {
    fontSize: "48px",
    fontWeight: "700",
    marginBottom: "10px",
  },
  statLabel: {
    fontSize: "16px",
    opacity: 0.9,
  },
  howItWorksSection: {
    padding: "80px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "30px",
  },
  step: {
    textAlign: "center",
  },
  stepNumber: {
    width: "60px",
    height: "60px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontSize: "28px",
    fontWeight: "700",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  stepTitle: {
    fontSize: "20px",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#333",
  },
  stepDesc: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.6",
  },
  footer: {
    padding: "40px 20px",
    background: "#1a1a1a",
    color: "white",
    textAlign: "center",
  },
  footerText: {
    fontSize: "14px",
    marginBottom: "10px",
  },
  footerSubtext: {
    fontSize: "12px",
    opacity: 0.7,
  },
};

export default LandingPage;
