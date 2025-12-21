import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const socket = io("http://localhost:3001");

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [studentStreams, setStudentStreams] = useState({});
  const [studentsFaceStatus, setStudentsFaceStatus] = useState({});
  const [userLocations, setUserLocations] = useState({});

  const peerConnectionsRef = useRef({});
  const hasRegistered = useRef(false);

  useEffect(() => {
    // Register admin ONCE
    if (!hasRegistered.current) {
      console.log("👨‍💼 ADMIN: Registering");
      socket.emit("register-admin");
      hasRegistered.current = true;
    }

    // USERS UPDATED
    socket.on("users-updated", (list) => {
      console.log("👥 ADMIN: Users updated:", list.length);
      const students = list.filter((u) => u.type === "user");
      setUsers(students);
    });

    // FACE STATUS
    socket.on("face-status", (data) => {
      setStudentsFaceStatus((prev) => ({
        ...prev,
        [data.userId]: { hasFace: data.hasFace, confidence: data.confidence },
      }));
    });

    // LOCATION UPDATE
    socket.on("user-location-update", ({ userId, location }) => {
      setUserLocations((prev) => ({ ...prev, [userId]: location }));
    });

    // OFFER HANDLER
    socket.on("offer", async ({ offer, from }) => {
      console.log("📨 ADMIN: Offer from:", from);

      // Close old connection
      if (peerConnectionsRef.current[from]) {
        console.log("🔄 ADMIN: Closing old connection for:", from);
        peerConnectionsRef.current[from].close();
      }

      // Create new peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peerConnectionsRef.current[from] = pc;

      // ON TRACK
      pc.ontrack = (event) => {
        console.log("📹 ADMIN: Track from:", from);
        if (event.streams && event.streams[0]) {
          setStudentStreams((prev) => {
            const updated = { ...prev, [from]: event.streams[0] };
            console.log("✅ ADMIN: Stream set for:", from);
            return updated;
          });
        }
      };

      // ON ICE CANDIDATE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: from,
            from: "admin",
          });
        }
      };

      // CONNECTION STATE
      pc.onconnectionstatechange = () => {
        console.log("🔌 ADMIN:", from, "→", pc.connectionState);
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          setStudentStreams((prev) => {
            const updated = { ...prev };
            delete updated[from];
            return updated;
          });
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("✅ ADMIN: Remote desc set for:", from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("✅ ADMIN: Answer created for:", from);

        socket.emit("answer", { answer, to: from });
        console.log("✅ ADMIN: Answer sent to:", from);
      } catch (error) {
        console.error("❌ ADMIN: Error for", from, ":", error);
      }
    });

    // ICE CANDIDATE
    socket.on("ice-candidate", async ({ candidate, from }) => {
      if (peerConnectionsRef.current[from]) {
        try {
          await peerConnectionsRef.current[from].addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error("❌ ADMIN: ICE error:", error);
        }
      }
    });

    // CLEANUP
    return () => {
      console.log("🧹 ADMIN: Cleaning up listeners");
      socket.off("users-updated");
      socket.off("face-status");
      socket.off("user-location-update");
      socket.off("offer");
      socket.off("ice-candidate");
    };
  }, []); // ← EMPTY DEPENDENCY ARRAY!

  // VideoPlayer Component
  const VideoPlayer = ({ stream, studentId }) => {
    const videoRef = useRef();

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "250px", background: "#2c3e50", padding: "20px" }}>
        <h2 style={{ color: "white" }}>Monitor List</h2>
        {users.map((u) => (
          <div
            key={u.userId}
            style={{
              padding: "10px",
              background: "#34495e",
              margin: "10px 0",
              borderRadius: "5px",
              color: "white",
            }}
          >
            {u.userId.substring(0, 12)}...
            {studentsFaceStatus[u.userId]?.hasFace ? " 🟢" : " 🔴"}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "20px", overflowY: "scroll" }}>
        <h1>Admin Dashboard</h1>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "20px",
          }}
        >
          {users.map((user) => {
            const stream = studentStreams[user.userId];
            const faceData = studentsFaceStatus[user.userId];
            const location = userLocations[user.userId];

            return (
              <div
                key={user.userId}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  overflow: "hidden",
                  background: "white",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "10px",
                    background: "#f8f9fa",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div>{user.userId}</div>
                  <div
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      color: "white",
                      background: faceData?.hasFace ? "#4caf50" : "#f44336",
                    }}
                  >
                    {faceData?.hasFace
                      ? `✅ ${faceData.confidence}%`
                      : "🚨 NO FACE"}
                  </div>
                </div>

                {/* Video */}
                <div
                  style={{
                    position: "relative",
                    paddingTop: "56.25%",
                    background: "#000",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {stream ? (
                      <VideoPlayer stream={stream} studentId={user.userId} />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          color: "#888",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            border: "4px solid rgba(255,255,255,0.2)",
                            borderTop: "4px solid rgba(255,255,255,0.6)",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        ></div>
                        <p>Waiting for {user.userId.substring(0, 15)}...</p>
                        <small style={{ color: "#666" }}>
                          Student needs to click "Start Exam"
                        </small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Map */}
                {location && (
                  <div style={{ padding: "10px" }}>
                    <MapContainer
                      center={[location.latitude, location.longitude]}
                      zoom={15}
                      style={{ height: "200px", borderRadius: "8px" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker
                        position={[location.latitude, location.longitude]}
                      />
                    </MapContainer>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
