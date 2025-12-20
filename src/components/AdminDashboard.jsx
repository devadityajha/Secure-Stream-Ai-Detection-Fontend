//working but not update face detection while staying on admindashboard
import React, { useEffect, useState, useRef, useCallback } from "react";
import io from "socket.io-client";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const studentIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapRecenter({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], 15, {
        animate: true,
      });
    }
  }, [location, map]);
  return null;
}

const socket = io("http://localhost:3001");

// 🔥 UPDATED VIDEO PLAYER WITH LOADING STATE
const VideoPlayer = React.memo(({ stream, studentId }) => {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream && stream.active) {
      console.log("🎥 Attaching stream to video for:", studentId);
      videoRef.current.srcObject = stream;

      videoRef.current.onloadedmetadata = () => {
        console.log("✅ Video loaded for:", studentId);
        setIsLoaded(true);
        videoRef.current.play().catch((err) => {
          console.error("❌ Play error for", studentId, ":", err.message);
        });
      };

      videoRef.current.onerror = (err) => {
        console.error("❌ Video error for", studentId, ":", err);
        setIsLoaded(false);
      };
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsLoaded(false);
    };
  }, [stream, studentId]);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />
      {!isLoaded && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            color: "#fff",
            fontSize: "14px",
          }}
        >
          Loading video...
        </div>
      )}
    </>
  );
});

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [userLocations, setUserLocations] = useState({});
  const [locationHistory, setLocationHistory] = useState({});
  const [studentsFaceStatus, setStudentsFaceStatus] = useState({});
  const [studentStreams, setStudentStreams] = useState({});

  const peerConnectionsRef = useRef({});
  const pendingCandidatesRef = useRef({});

  useEffect(() => {
    console.log("✅ ADMIN: Registering...");
    socket.emit("register-admin");

    socket.on("connect", () => {
      console.log("✅ ADMIN: Connected to server");
    });

    socket.on("users-updated", (list) => {
      console.log("📋 ADMIN: Users updated:", list);
      const students = list.filter((u) => u.type === "user");
      setUsers(students);

      if (!selectedUser && students.length > 0) {
        setSelectedUser(students[0].userId);
      }
    });

    socket.on("offer", handleOffer);
    socket.on("ice-candidate", handleIceCandidate);

    socket.on("user-location-update", ({ userId, location }) => {
      console.log("📍 ADMIN: Received location for", userId, location);

      setUserLocations((prev) => {
        const updated = { ...prev, [userId]: location };
        console.log("📍 ADMIN: Updated locations:", updated);
        return updated;
      });

      setLocationHistory((prev) => ({
        ...prev,
        [userId]: [
          ...(prev[userId] || []),
          [location.latitude, location.longitude],
        ],
      }));
    });

    socket.on("face-status", (data) => {
      const studentId = data.userId || data.studentId;

      if (studentId) {
        console.log(
          "📊 Face update:",
          studentId,
          "hasFace:",
          data.hasFace,
          "confidence:",
          data.confidence
        );

        setStudentsFaceStatus((prev) => {
          const updated = {
            ...prev,
            [studentId]: {
              hasFace: Boolean(data.hasFace),
              confidence: Number(data.confidence) || 0,
              lastSeen: Date.now(),
              timestamp: data.timestamp,
            },
          };
          return { ...updated }; // 🔥 Force new object reference
        });
      }
    });

    // 🔥 AUTO-REFRESH EVERY 1 SECOND
    return () => {
      socket.off();
    };
  }, []);

  const handleOffer = useCallback(async ({ offer, from }) => {
    try {
      console.log("📞 ADMIN: Received offer from:", from);

      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      if (peerConnectionsRef.current[from]) {
        peerConnectionsRef.current[from].close();
      }

      const peerConnection = new RTCPeerConnection(config);
      peerConnectionsRef.current[from] = peerConnection;

      // 🔥 UPDATED STREAM HANDLER
      peerConnection.ontrack = (event) => {
        console.log("🎥 ADMIN: Received track from:", from, event.track.kind);
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          console.log(
            "✅ Stream active:",
            stream.active,
            "tracks:",
            stream.getTracks().length
          );

          setStudentStreams((prev) => ({
            ...prev,
            [from]: stream,
          }));
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: from,
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log(`🔗 ${from}: ${state}`);
      };

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      if (pendingCandidatesRef.current[from]) {
        for (const candidate of pendingCandidatesRef.current[from]) {
          await peerConnection.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current[from] = [];
      }

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  }, []);

  const handleIceCandidate = useCallback(async ({ candidate, from }) => {
    try {
      const peerConnection = peerConnectionsRef.current[from];

      if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        if (!pendingCandidatesRef.current[from]) {
          pendingCandidatesRef.current[from] = [];
        }
        pendingCandidatesRef.current[from].push(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  }, []);

  const sendFeedback = () => {
    if (selectedUser && feedbackText) {
      socket.emit("send-feedback", {
        userId: selectedUser,
        message: feedbackText,
      });
      setFeedbackText("");
      alert("✅ Alert sent!");
    }
  };

  const calculateDistance = (path) => {
    if (!path || path.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const [lat1, lon1] = path[i];
      const [lat2, lon2] = path[i + 1];
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      total += R * c;
    }
    return total;
  };

  const StudentCards = () => {
    const studentList = users.filter((u) => u.cameraActive);

    if (studentList.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>👻</div>
          <h3 style={styles.emptyTitle}>No Active Students</h3>
          <p style={styles.emptyText}>
            Waiting for students to start their exam...
          </p>
        </div>
      );
    }

    return (
      <div style={styles.cardsGrid}>
        {studentList.map((user) => {
          const socketId = user.socketId;
          const stream = studentStreams[socketId];
          const faceData = studentsFaceStatus[user.userId];
          const hasFace = faceData?.hasFace === true;
          const confidence = faceData?.confidence || 0;
          const location = userLocations[user.userId];
          const distance = calculateDistance(locationHistory[user.userId]);

          console.log(`🗺️ Student ${user.userId} location:`, location);

          return (
            <div key={user.userId} style={styles.studentCard}>
              <div style={styles.studentCardHeader}>
                <div style={styles.studentInfo}>
                  <span style={styles.studentAvatar}>👤</span>
                  <div>
                    <div style={styles.studentId}>
                      {user.userId.substring(0, 18)}...
                    </div>
                    <div style={styles.studentMeta}>Session Active</div>
                  </div>
                </div>
                <div
                  style={{
                    ...styles.faceStatusPill,
                    background: hasFace ? "#4caf50" : "#f44336",
                  }}
                >
                  {hasFace ? `✅ ${confidence}%` : "🚨 NO FACE"}
                </div>
              </div>

              <div style={styles.videoSection}>
                <div style={styles.videoHeader}>
                  <span style={styles.videoTitle}>📹 Live Camera Feed</span>
                  <span style={styles.liveBadge}>● LIVE</span>
                </div>
                {/* 🔥 UPDATED VIDEO WRAPPER WITH STREAM VALIDATION */}
                <div style={styles.videoWrapper}>
                  {stream && stream.active ? (
                    <VideoPlayer stream={stream} studentId={user.userId} />
                  ) : (
                    <div style={styles.videoPlaceholder}>
                      <div style={styles.spinner}></div>
                      <p style={styles.placeholderText}>
                        {stream
                          ? "Loading video..."
                          : "Establishing connection..."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.locationSection}>
                <div style={styles.locationHeader}>
                  <span style={styles.locationTitle}>📍 Live Location</span>
                  <span style={styles.distanceBadge}>
                    🚶 {distance.toFixed(0)}m
                  </span>
                </div>
                <div style={styles.mapWrapper}>
                  {location ? (
                    <MapContainer
                      key={`${user.userId}-${location.latitude}-${location.longitude}`}
                      center={[location.latitude, location.longitude]}
                      zoom={15}
                      style={styles.map}
                      scrollWheelZoom={false}
                      dragging={false}
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapRecenter location={location} />
                      <Marker
                        position={[location.latitude, location.longitude]}
                        icon={studentIcon}
                      >
                        <Popup>
                          <div>
                            <strong>{user.userId}</strong>
                            <br />
                            Lat: {location.latitude.toFixed(6)}
                            <br />
                            Lng: {location.longitude.toFixed(6)}
                          </div>
                        </Popup>
                      </Marker>
                      {locationHistory[user.userId] &&
                        locationHistory[user.userId].length > 1 && (
                          <Polyline
                            positions={locationHistory[user.userId]}
                            pathOptions={{ color: "#f44336", weight: 3 }}
                          />
                        )}
                    </MapContainer>
                  ) : (
                    <div style={styles.mapPlaceholder}>
                      <span style={styles.mapPlaceholderIcon}>📍</span>
                      <p style={styles.mapPlaceholderText}>
                        Waiting for GPS...
                      </p>
                    </div>
                  )}
                </div>
                {location && (
                  <div style={styles.locationFooter}>
                    <span style={styles.coordText}>
                      {location.latitude.toFixed(6)},{" "}
                      {location.longitude.toFixed(6)}
                    </span>
                    <span style={styles.accuracyText}>
                      ±{location.accuracy.toFixed(0)}m
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  socket.emit("send-feedback", {
                    userId: user.userId,
                    message: "🚨 ALERT: Please stay focused on your exam!",
                  });
                  alert("Alert sent!");
                }}
                style={styles.quickAlertBtn}
              >
                📢 Send Quick Alert
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.brandSection}>
          <div style={styles.brandIcon}>🎓</div>
          <div>
            <div style={styles.brandName}>SecureStream AI</div>
            <div style={styles.brandTagline}>Proctor Console</div>
          </div>
        </div>

        <div style={styles.statsContainer}>
          <div style={styles.miniStat}>
            <div style={styles.miniStatIcon}>👥</div>
            <div>
              <div style={styles.miniStatValue}>{users.length}</div>
              <div style={styles.miniStatLabel}>Students</div>
            </div>
          </div>
          <div style={styles.miniStat}>
            <div style={styles.miniStatIcon}>📹</div>
            <div>
              <div style={styles.miniStatValue}>
                {users.filter((u) => u.cameraActive).length}
              </div>
              <div style={styles.miniStatLabel}>Monitored</div>
            </div>
          </div>
        </div>

        <div style={styles.divider}></div>

        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>👁️</span>
            <span style={styles.sectionTitle}>Face Monitoring</span>
          </div>

          {users.length === 0 ? (
            <div style={styles.sidebarEmpty}>
              <div style={styles.sidebarEmptyIcon}>👻</div>
              <div style={styles.sidebarEmptyText}>No students</div>
            </div>
          ) : (
            users.map((user) => {
              const faceData = studentsFaceStatus[user.userId];
              const isFacePresent = faceData?.hasFace === true;
              const confidence = faceData?.confidence || 0;

              return (
                <div
                  key={user.userId}
                  style={{
                    ...styles.studentItem,
                    background:
                      selectedUser === user.userId
                        ? "rgba(255,255,255,0.3)"
                        : isFacePresent
                        ? "rgba(76,175,80,0.2)"
                        : "rgba(244,67,54,0.2)",
                    borderLeft: `4px solid ${
                      isFacePresent ? "#4caf50" : "#f44336"
                    }`,
                  }}
                  onClick={() => setSelectedUser(user.userId)}
                >
                  <div style={styles.studentAvatar2}>
                    <span style={styles.avatarEmoji}>👤</span>
                    <div
                      style={{
                        ...styles.liveDot,
                        background: isFacePresent ? "#4caf50" : "#f44336",
                      }}
                    ></div>
                  </div>
                  <div style={styles.studentDetails}>
                    <div style={styles.studentName}>
                      {user.userId.substring(0, 12)}...
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: isFacePresent ? "#4caf50" : "#f44336",
                        fontWeight: "bold",
                      }}
                    >
                      {faceData
                        ? isFacePresent
                          ? `✅ ${confidence}%`
                          : "🚨 NO FACE"
                        : "⚪ Waiting"}
                    </div>
                  </div>
                  {userLocations[user.userId] && (
                    <div style={styles.trackingBadge}>📍</div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={styles.divider}></div>
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>📢</span>
            <span style={styles.sectionTitle}>Send Alert</span>
          </div>

          <select
            value={selectedUser || ""}
            onChange={(e) => setSelectedUser(e.target.value)}
            style={styles.selectInput}
          >
            <option value="">Select student...</option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.userId.substring(0, 15)}...
              </option>
            ))}
          </select>

          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Type warning..."
            style={styles.textareaInput}
          />

          <button
            onClick={sendFeedback}
            style={styles.sendBtn}
            disabled={!selectedUser || !feedbackText}
          >
            <span>📤</span> Send Alert
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Monitoring Dashboard</h1>
            <p style={styles.pageSubtitle}>Real-time exam surveillance</p>
          </div>
          <div style={styles.statusPill}>
            <div style={{ ...styles.statusDot, background: "#4caf50" }}></div>
            <span style={styles.statusText}>LIVE</span>
          </div>
        </div>

        <StudentCards />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    color: "#333",
  },
  sidebar: {
    width: "320px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    borderRight: "1px solid rgba(255,255,255,0.2)",
    padding: "25px",
    color: "white",
    overflowY: "auto",
    boxShadow: "2px 0 20px rgba(0,0,0,0.1)",
  },
  brandSection: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
  },
  brandIcon: { fontSize: "42px" },
  brandName: { fontSize: "22px", fontWeight: "700", letterSpacing: "-0.5px" },
  brandTagline: { fontSize: "12px", opacity: 0.8, marginTop: "2px" },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "25px",
  },
  miniStat: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.15)",
    padding: "18px 15px",
    borderRadius: "14px",
    backdropFilter: "blur(10px)",
  },
  miniStatIcon: { fontSize: "26px" },
  miniStatValue: { fontSize: "26px", fontWeight: "700" },
  miniStatLabel: { fontSize: "11px", opacity: 0.9, marginTop: "2px" },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.2)",
    margin: "25px 0",
  },
  section: { marginBottom: "25px" },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },
  sectionIcon: { fontSize: "18px" },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  sidebarEmpty: { textAlign: "center", padding: "30px 10px" },
  sidebarEmptyIcon: { fontSize: "42px", opacity: 0.5, marginBottom: "8px" },
  sidebarEmptyText: { fontSize: "13px", opacity: 0.7 },
  studentItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "12px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  studentAvatar2: {
    position: "relative",
    width: "42px",
    height: "42px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: "20px" },
  liveDot: {
    position: "absolute",
    top: "0",
    right: "0",
    width: "10px",
    height: "10px",
    border: "2px solid white",
    borderRadius: "50%",
  },
  studentDetails: { flex: 1 },
  studentName: { fontSize: "13px", fontWeight: "600", marginBottom: "3px" },
  trackingBadge: { fontSize: "16px" },
  selectInput: {
    width: "100%",
    padding: "12px 14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "10px",
    fontSize: "13px",
    marginBottom: "12px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    backdropFilter: "blur(10px)",
  },
  textareaInput: {
    width: "100%",
    minHeight: "80px",
    padding: "12px 14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderRadius: "10px",
    fontSize: "13px",
    fontFamily: "inherit",
    resize: "vertical",
    marginBottom: "12px",
    background: "rgba(255,255,255,0.1)",
    color: "white",
    backdropFilter: "blur(10px)",
  },
  sendBtn: {
    width: "100%",
    padding: "12px 18px",
    background: "linear-gradient(135deg, #f44336 0%, #e91e63 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 4px 15px rgba(244, 67, 54, 0.3)",
    transition: "transform 0.2s ease",
  },
  mainContent: { flex: 1, padding: "25px", overflowY: "auto" },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    background: "rgba(255,255,255,0.95)",
    padding: "22px 28px",
    borderRadius: "18px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    backdropFilter: "blur(10px)",
  },
  pageTitle: {
    fontSize: "30px",
    fontWeight: "700",
    margin: 0,
    letterSpacing: "-1px",
  },
  pageSubtitle: { fontSize: "14px", color: "#666", marginTop: "5px" },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 22px",
    background: "white",
    border: "2px solid #4caf50",
    borderRadius: "30px",
    boxShadow: "0 4px 15px rgba(76, 175, 80, 0.2)",
  },
  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  statusText: { fontSize: "14px", fontWeight: "700", color: "#4caf50" },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
    gap: "25px",
  },
  studentCard: {
    background: "rgba(255,255,255,0.97)",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
  },
  studentCardHeader: {
    padding: "20px 24px",
    background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
    borderBottom: "2px solid #e0e0e0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  studentAvatar: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },
  studentId: { fontSize: "15px", fontWeight: "700", color: "#1a1a1a" },
  studentMeta: { fontSize: "12px", color: "#666", marginTop: "3px" },
  faceStatusPill: {
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "700",
    color: "white",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },

  videoSection: { padding: "20px 24px", borderBottom: "2px solid #f0f0f0" },
  videoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  videoTitle: { fontSize: "14px", fontWeight: "700", color: "#333" },
  liveBadge: { fontSize: "12px", color: "#f44336", fontWeight: "700" },
  videoWrapper: {
    position: "relative",
    paddingTop: "56.25%",
    background: "#000",
    borderRadius: "12px",
    overflow: "hidden",
  },
  videoPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
  },
  spinner: {
    width: "42px",
    height: "42px",
    border: "4px solid rgba(255,255,255,0.2)",
    borderTop: "4px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  placeholderText: { color: "rgba(255,255,255,0.8)", fontSize: "14px" },

  locationSection: { padding: "20px 24px" },
  locationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  locationTitle: { fontSize: "14px", fontWeight: "700", color: "#333" },
  distanceBadge: {
    fontSize: "12px",
    background: "#f0f0f0",
    padding: "5px 12px",
    borderRadius: "12px",
    fontWeight: "600",
    color: "#666",
  },
  mapWrapper: {
    height: "220px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "2px solid #e0e0e0",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapPlaceholder: {
    width: "100%",
    height: "100%",
    background: "#f8f9fa",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholderIcon: { fontSize: "48px", marginBottom: "10px", opacity: 0.5 },
  mapPlaceholderText: { fontSize: "13px", color: "#999" },
  locationFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
    padding: "10px 14px",
    background: "#f8f9fa",
    borderRadius: "10px",
  },
  coordText: { fontSize: "12px", color: "#666", fontFamily: "monospace" },
  accuracyText: { fontSize: "11px", color: "#999", fontWeight: "600" },

  quickAlertBtn: {
    width: "calc(100% - 48px)",
    margin: "0 24px 20px 24px",
    padding: "14px",
    background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(255, 152, 0, 0.3)",
    transition: "transform 0.2s ease",
  },

  emptyState: {
    textAlign: "center",
    padding: "80px 40px",
    background: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
  },
  emptyIcon: { fontSize: "72px", marginBottom: "20px", opacity: 0.6 },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 0 10px 0",
    color: "#333",
  },
  emptyText: { fontSize: "15px", color: "#666" },
};

export default AdminDashboard;
