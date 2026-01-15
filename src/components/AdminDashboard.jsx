import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [streams, setStreams] = useState({});
  const [faceData, setFaceData] = useState({});
  const [tabSwitchData, setTabSwitchData] = useState({});
  const [windowSwitchData, setWindowSwitchData] = useState({});
  const [screenshotData, setScreenshotData] = useState({}); // New State

  const pcs = useRef({});

  useEffect(() => {
    socket.emit("register-admin");

    socket.on("users-updated", (list) => {
      setStudents(list.filter((u) => u.type === "user"));
    });

    socket.on("face-status", (data) => {
      setFaceData((prev) => ({ ...prev, [data.userId]: data }));
    });

    socket.on("tab-switch", (data) => {
      setTabSwitchData((prev) => ({
        ...prev,
        [data.userId]: { count: data.count, lastSwitch: Date.now() },
      }));
    });

    socket.on("window-switch", (data) => {
      setWindowSwitchData((prev) => ({
        ...prev,
        [data.userId]: { count: data.count, lastSwitch: Date.now() },
      }));
    });

    socket.on("screenshot-taken", (data) => {
      setScreenshotData((prev) => ({ ...prev, [data.userId]: data.count }));
    });

    socket.on("offer", async ({ offer, from }) => {
      if (pcs.current[from]) pcs.current[from].close();
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcs.current[from] = pc;

      pc.ontrack = (e) => {
        setStreams((prev) => {
          const userStreams = prev[from] || {};
          if (!userStreams.camera)
            return {
              ...prev,
              [from]: { ...userStreams, camera: e.streams[0] },
            };
          else
            return {
              ...prev,
              [from]: { ...userStreams, screen: e.streams[0] },
            };
        });
      };

      pc.onicecandidate = (e) =>
        e.candidate &&
        socket.emit("ice-candidate", {
          candidate: e.candidate,
          to: from,
          from: "admin",
        });
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });
    });

    return () => {
      socket.off();
    };
  }, []);

  return (
    <div style={styles.layout}>
      {/* Injecting CSS Animation for the flash */}
      <style>{`
        @keyframes flashRed {
          0% { background: rgba(255, 71, 87, 0.1); }
          50% { background: rgba(255, 71, 87, 0.8); color: white; transform: scale(1.05); }
          100% { background: rgba(255, 71, 87, 0.1); }
        }
        .flash-alert { animation: flashRed 0.5s ease infinite; }
      `}</style>

      <aside style={styles.sidebar}>
        <div style={styles.brandGroup}>
          <div style={styles.brandLogo}>🎓</div>
          <div>
            <div style={styles.brandTitle}>SecureStream AI</div>
            <div style={styles.brandSub}>Proctor Console</div>
          </div>
        </div>
        <div style={styles.sectionTitle}>👁️ FACE MONITORING</div>
        <div style={styles.scrollList}>
          {students.map((s) => (
            <div key={s.userId} style={styles.navItem}>
              <div style={styles.navMain}>
                <div style={styles.navAvatar}>👤</div>
                <div style={styles.navName}>{s.userId.slice(0, 10)}...</div>
                <div
                  style={{
                    ...styles.navStatus,
                    color: faceData[s.userId]?.hasFace ? "#4ade80" : "#fb7185",
                  }}
                >
                  {faceData[s.userId]?.hasFace
                    ? `${faceData[s.userId].confidence}%`
                    : "🚨"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topHeader}>
          <h1 style={styles.mainHeading}>Monitoring Dashboard</h1>
          <div style={styles.liveTag}>● LIVE</div>
        </div>
        <div style={styles.grid}>
          {students.map((user) => (
            <StudentCard
              key={user.userId}
              user={user}
              userStreams={streams[user.userId]}
              face={faceData[user.userId]}
              tabData={tabSwitchData[user.userId]}
              windowData={windowSwitchData[user.userId]}
              ssCount={screenshotData[user.userId]} // Passing the SS Count
            />
          ))}
        </div>
      </main>
    </div>
  );
}

const StudentCard = ({
  user,
  userStreams,
  face,
  tabData,
  windowData,
  ssCount,
}) => {
  const [viewMode, setViewMode] = useState("camera");
  const [isFlashing, setIsFlashing] = useState(false);
  const vRef = useRef();

  // Logic: When ssCount increases, flash red and auto-switch to screen feed
  useEffect(() => {
    if (ssCount > 0) {
      setIsFlashing(true);
      setViewMode("screen"); // Auto-switch for evidence
      const timer = setTimeout(() => setIsFlashing(false), 3000); // Flash for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [ssCount]);

  useEffect(() => {
    if (vRef.current && userStreams) {
      vRef.current.srcObject =
        viewMode === "camera" ? userStreams.camera : userStreams.screen;
    }
  }, [userStreams, viewMode]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardInfo}>
          <div style={styles.cardAvatar}>👤</div>
          <div>
            <div style={styles.cardName}>{user.userId.slice(0, 15)}...</div>

            {/* Classy Scissors Indicator */}
            <div
              className={isFlashing ? "flash-alert" : ""}
              style={{
                fontSize: "10px",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 8px",
                borderRadius: "8px",
                marginTop: "4px",
                color: ssCount > 0 ? "#ff4757" : "#2ecc71",
                background:
                  ssCount > 0
                    ? "rgba(255, 71, 87, 0.1)"
                    : "rgba(46, 204, 113, 0.1)",
                fontWeight: "bold",
                transition: "all 0.3s ease",
              }}
            >
              <span>✂️</span> <span>{ssCount || 0} SCREENSHOTS</span>
            </div>
          </div>
        </div>
        <div style={styles.badgeContainer}>
          <div style={styles.circularBadge}>
            <div
              style={{
                color: (face?.confidence || 0) > 70 ? "#4ade80" : "#fb7185",
                fontWeight: "bold",
              }}
            >
              {face?.confidence || 0}%
            </div>
            <div style={styles.badgeLabel}>Face</div>
          </div>
          <div style={styles.circularBadge}>
            <div style={{ color: "#ffa502", fontWeight: "bold" }}>
              {tabData?.count || 0}x
            </div>
            <div style={styles.badgeLabel}>Tab</div>
          </div>
          <div style={styles.circularBadge}>
            <div style={{ color: "#8b5cf6", fontWeight: "bold" }}>
              {windowData?.count || 0}x
            </div>
            <div style={styles.badgeLabel}>Win</div>
          </div>
        </div>
      </div>

      <div style={styles.videoContainer}>
        <div style={styles.videoHeader}>
          <span>
            {viewMode === "camera" ? "📸 Camera Feed" : "🖥️ Screen Feed"}
          </span>
          <button
            onClick={() =>
              setViewMode(viewMode === "camera" ? "screen" : "camera")
            }
            style={styles.toggleBtn}
          >
            Switch to {viewMode === "camera" ? "Screen" : "Camera"}
          </button>
        </div>
        <div style={styles.videoContent}>
          {userStreams ? (
            <video ref={vRef} autoPlay playsInline muted style={styles.video} />
          ) : (
            <div style={styles.loader}>Connecting...</div>
          )}
        </div>
      </div>
      <button style={styles.quickBtn}>📩 Send Alert</button>
    </div>
  );
};

const styles = {
  // ... (Keeping all your existing Admin styles)
  layout: {
    display: "flex",
    height: "100vh",
    background: "#4e5ba6",
    fontFamily: "sans-serif",
  },
  sidebar: {
    width: "300px",
    background: "#7c89df",
    padding: "30px 20px",
    color: "white",
    overflowY: "auto",
  },
  brandGroup: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
  },
  brandLogo: { fontSize: "30px" },
  brandTitle: { fontWeight: "900" },
  brandSub: { fontSize: "11px", opacity: 0.8 },
  sectionTitle: { fontSize: "11px", fontWeight: "900", marginBottom: "12px" },
  scrollList: { display: "flex", flexDirection: "column", gap: "12px" },
  navItem: {
    background: "rgba(255,255,255,0.1)",
    padding: "12px",
    borderRadius: "14px",
  },
  navMain: { display: "flex", gap: "12px", alignItems: "center" },
  navAvatar: {
    background: "rgba(255,255,255,0.2)",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navName: { fontSize: "12px", flex: 1 },
  navStatus: { fontWeight: "bold" },
  main: { flex: 1, padding: "35px", overflowY: "auto" },
  topHeader: {
    background: "white",
    padding: "20px",
    borderRadius: "20px",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "30px",
  },
  mainHeading: { fontSize: "24px", margin: 0 },
  liveTag: {
    color: "#2ecc71",
    border: "1px solid #2ecc71",
    padding: "5px 15px",
    borderRadius: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "25px",
  },
  card: {
    background: "white",
    borderRadius: "25px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "15px",
  },
  cardInfo: { display: "flex", gap: "10px" },
  cardAvatar: {
    background: "#7c89df",
    color: "white",
    width: "35px",
    height: "35px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: "15px", fontWeight: "900" },
  badgeContainer: { display: "flex", gap: "10px" },
  circularBadge: { textAlign: "center" },
  badgeLabel: { fontSize: "8px", color: "#999" },
  videoContainer: {
    borderRadius: "15px",
    overflow: "hidden",
    border: "1px solid #eee",
  },
  videoHeader: {
    padding: "10px",
    background: "#f8f9fa",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px",
  },
  toggleBtn: {
    background: "#7c89df",
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "10px",
  },
  videoContent: { height: "200px", background: "black" },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  quickBtn: {
    width: "100%",
    background: "#f39c12",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "12px",
    marginTop: "15px",
    cursor: "pointer",
  },
  loader: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
};

export default AdminDashboard;
