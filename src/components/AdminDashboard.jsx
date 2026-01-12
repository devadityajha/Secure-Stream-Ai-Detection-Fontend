import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [streams, setStreams] = useState({});
  const [faceData, setFaceData] = useState({});
  const [tabSwitchData, setTabSwitchData] = useState({});
  const [windowSwitchData, setWindowSwitchData] = useState({}); // New State

  const pcs = useRef({});

  useEffect(() => {
    socket.emit("register-admin");

    socket.on("users-updated", (list) => {
      setStudents(list.filter((u) => u.type === "user"));
    });

    socket.on("face-status", (data) => {
      setFaceData((prev) => ({ ...prev, [data.userId]: data }));
    });

    // Tab Switch Listener
    socket.on("tab-switch", (data) => {
      setTabSwitchData((prev) => ({
        ...prev,
        [data.userId]: {
          count: data.count,
          lastSwitch: Date.now(),
        },
      }));
    });

    // Window Switch Listener
    socket.on("window-switch", (data) => {
      setWindowSwitchData((prev) => ({
        ...prev,
        [data.userId]: {
          count: data.count,
          lastSwitch: Date.now(),
        },
      }));
    });

    socket.on("offer", async ({ offer, from }) => {
      if (pcs.current[from]) pcs.current[from].close();
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcs.current[from] = pc;
      pc.ontrack = (e) =>
        setStreams((prev) => ({ ...prev, [from]: e.streams[0] }));
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
      socket.off("users-updated");
      socket.off("face-status");
      socket.off("tab-switch");
      socket.off("window-switch");
      socket.off("offer");
    };
  }, []);

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.brandGroup}>
          <div style={styles.brandLogo}>🎓</div>
          <div>
            <div style={styles.brandTitle}>SecureStream AI</div>
            <div style={styles.brandSub}>Proctor Console</div>
          </div>
        </div>

        <div style={styles.statCards}>
          <div style={styles.statBox}>
            <span style={{ fontSize: "24px" }}>👥</span>
            <div>
              <div style={styles.statNum}>{students.length}</div>
              <div style={styles.statLabel}>Students</div>
            </div>
          </div>
          <div style={styles.statBox}>
            <span style={{ fontSize: "24px" }}>📸</span>
            <div>
              <div style={styles.statNum}>{Object.keys(streams).length}</div>
              <div style={styles.statLabel}>Monitored</div>
            </div>
          </div>
        </div>

        <div style={styles.sectionTitle}>👁️ FACE MONITORING</div>
        <div style={styles.scrollList}>
          {students.map((s) => {
            const conf = faceData[s.userId]?.confidence || 0;
            return (
              <div key={s.userId} style={styles.navItem}>
                <div style={styles.navMain}>
                  <div style={styles.navAvatar}>👤</div>
                  <div style={styles.navName}>{s.userId.slice(0, 10)}...</div>
                  <div
                    style={{
                      ...styles.navStatus,
                      color: faceData[s.userId]?.hasFace
                        ? "#4ade80"
                        : "#fb7185",
                    }}
                  >
                    {faceData[s.userId]?.hasFace ? `${conf}%` : "🚨"}
                  </div>
                </div>
                <div style={styles.barBg}>
                  <div
                    style={{
                      height: "100%",
                      width: `${conf}%`,
                      background:
                        conf > 50
                          ? "linear-gradient(90deg, #4ade80, #22c55e)"
                          : "linear-gradient(90deg, #fb7185, #ef4444)",
                      borderRadius: "10px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.topHeader}>
          <div>
            <h1 style={styles.mainHeading}>Monitoring Dashboard</h1>
            <p style={styles.mainSubHeading}>Real-time surveillance console</p>
          </div>
          <div style={styles.liveTag}>● LIVE</div>
        </div>

        <div style={styles.grid}>
          {students.map((user) => (
            <StudentCard
              key={user.userId}
              user={user}
              stream={streams[user.userId]}
              face={faceData[user.userId]}
              tabData={tabSwitchData[user.userId]}
              windowData={windowSwitchData[user.userId]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

const StudentCard = ({ user, stream, face, tabData, windowData }) => {
  const vRef = useRef();
  const conf = face?.confidence || 0;
  const tabCount = tabData?.count || 0;
  const windowCount = windowData?.count || 0;
  const isRecentTab = tabData && Date.now() - tabData.lastSwitch < 2000;
  const isRecentWin = windowData && Date.now() - windowData.lastSwitch < 2000;

  useEffect(() => {
    if (vRef.current && stream) vRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardInfo}>
          <div style={styles.cardAvatar}>👤</div>
          <div>
            <div style={styles.cardName}>{user.userId.slice(0, 15)}...</div>
            <div style={styles.sessionStatus}>Session Active</div>
          </div>
        </div>

        <div style={styles.badgeContainer}>
          {/* FACE BADGE */}
          <div style={styles.circularBadge}>
            <svg width="45" height="45" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="5"
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke={conf > 70 ? "#4ade80" : "#fb7185"}
                strokeWidth="5"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * conf) / 100}
                strokeLinecap="round"
                transform="rotate(-90 25 25)"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
              <text
                x="25"
                y="29"
                fontSize="10"
                fontWeight="900"
                textAnchor="middle"
                fill="#475569"
              >
                {conf}%
              </text>
            </svg>
            <div style={styles.badgeLabel}>Face</div>
          </div>

          {/* TAB BADGE */}
          <div
            style={{
              ...styles.circularBadge,
              animation: isRecentTab ? "badgePulse 0.8s ease-in-out" : "none",
            }}
          >
            <svg width="45" height="45" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="5"
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke={tabCount > 3 ? "#ff4757" : "#ffa502"}
                strokeWidth="5"
                strokeDasharray="125.6"
                strokeDashoffset={
                  125.6 - (125.6 * Math.min(tabCount * 10, 100)) / 100
                }
                strokeLinecap="round"
                transform="rotate(-90 25 25)"
              />
              <text
                x="25"
                y="29"
                fontSize="10"
                fontWeight="900"
                textAnchor="middle"
                fill={tabCount > 0 ? "#ffa502" : "#94a3b8"}
              >
                {tabCount}x
              </text>
            </svg>
            <div style={styles.badgeLabel}>Tabs</div>
          </div>

          {/* WINDOW BADGE */}
          <div
            style={{
              ...styles.circularBadge,
              animation: isRecentWin ? "badgePulse 0.8s ease-in-out" : "none",
            }}
          >
            <svg width="45" height="45" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="5"
              />
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke={windowCount > 2 ? "#ef4444" : "#8b5cf6"}
                strokeWidth="5"
                strokeDasharray="125.6"
                strokeDashoffset={
                  125.6 - (125.6 * Math.min(windowCount * 20, 100)) / 100
                }
                strokeLinecap="round"
                transform="rotate(-90 25 25)"
              />
              <text
                x="25"
                y="29"
                fontSize="10"
                fontWeight="900"
                textAnchor="middle"
                fill={windowCount > 0 ? "#8b5cf6" : "#94a3b8"}
              >
                {windowCount}x
              </text>
            </svg>
            <div style={styles.badgeLabel}>Win</div>
          </div>
        </div>
      </div>

      <div style={styles.videoContainer}>
        <div style={styles.videoHeader}>
          <span>📸 Live Camera Feed</span>
          <span style={styles.livePulse}>● LIVE</span>
        </div>
        <div style={styles.videoContent}>
          {stream ? (
            <video ref={vRef} autoPlay playsInline muted style={styles.video} />
          ) : (
            <div style={styles.loader}>Connecting...</div>
          )}
        </div>
      </div>
      <button style={styles.quickBtn}>📩 Send Quick Alert</button>
    </div>
  );
};

const styles = {
  layout: {
    display: "flex",
    height: "100vh",
    background: "#4e5ba6",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  sidebar: {
    width: "300px",
    background: "#7c89df",
    padding: "30px 20px",
    color: "white",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  brandGroup: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
  },
  brandLogo: {
    fontSize: "30px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "12px",
    padding: "6px",
  },
  brandTitle: { fontSize: "18px", fontWeight: "900" },
  brandSub: { fontSize: "11px", opacity: 0.8 },
  statCards: { display: "flex", gap: "12px", marginBottom: "20px" },
  statBox: {
    flex: 1,
    background: "rgba(255,255,255,0.22)",
    padding: "12px",
    borderRadius: "15px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  statNum: { fontSize: "18px", fontWeight: "900" },
  statLabel: { fontSize: "10px", fontWeight: "600" },
  sectionTitle: {
    fontSize: "11px",
    fontWeight: "900",
    opacity: 0.8,
    marginBottom: "12px",
  },
  scrollList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  navItem: {
    background: "rgba(255,255,255,0.18)",
    padding: "12px",
    borderRadius: "14px",
  },
  navMain: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "8px",
  },
  navAvatar: {
    background: "rgba(255,255,255,0.25)",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navName: { fontSize: "12px", fontWeight: "800", flex: 1 },
  navStatus: { fontSize: "10px", fontWeight: "900" },
  barBg: {
    height: "6px",
    background: "rgba(0,0,0,0.35)",
    borderRadius: "10px",
    overflow: "hidden",
  },
  alertBox: {
    marginTop: "20px",
    background: "rgba(255,255,255,0.12)",
    padding: "15px",
    borderRadius: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    fontSize: "12px",
  },
  btnAlert: {
    width: "100%",
    background: "#ff4757",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "12px",
    fontWeight: "900",
    marginTop: "10px",
    cursor: "pointer",
  },
  main: { flex: 1, padding: "35px 45px", overflowY: "auto" },
  topHeader: {
    background: "white",
    padding: "25px 45px",
    borderRadius: "25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "35px",
  },
  mainHeading: {
    fontSize: "30px",
    fontWeight: "900",
    color: "#2d3436",
    margin: 0,
  },
  mainSubHeading: { fontSize: "14px", color: "#636e72" },
  liveTag: {
    color: "#2ecc71",
    border: "1.5px solid #2ecc71",
    padding: "6px 20px",
    borderRadius: "25px",
    fontSize: "12px",
    fontWeight: "900",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "30px",
  },
  card: {
    background: "white",
    borderRadius: "30px",
    padding: "22px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  cardInfo: { display: "flex", alignItems: "center", gap: "12px" },
  cardAvatar: {
    background: "#7c89df",
    color: "white",
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: { fontSize: "15px", fontWeight: "900" },
  sessionStatus: { fontSize: "11px", color: "#b2bec3" },
  badgeContainer: {
    display: "flex",
    gap: "12px",
  },
  circularBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  badgeLabel: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  videoContainer: {
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid #f1f2f6",
    marginBottom: "20px",
  },
  videoHeader: {
    padding: "12px 20px",
    background: "#fcfcfd",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    fontWeight: "900",
    color: "#636e72",
  },
  livePulse: { color: "#ff4757" },
  videoContent: { height: "200px", background: "#000" },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  quickBtn: {
    width: "100%",
    background: "#f39c12",
    color: "white",
    border: "none",
    padding: "14px",
    borderRadius: "16px",
    fontWeight: "900",
    cursor: "pointer",
  },
  loader: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#636e72",
    fontSize: "12px",
  },
};

export default AdminDashboard;
