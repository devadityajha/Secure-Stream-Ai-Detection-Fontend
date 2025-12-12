// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";

// const socket = io("http://localhost:3001");

// function AdminDashboard() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [feedbackText, setFeedbackText] = useState("");
//   const [connectionStatus, setConnectionStatus] = useState("Disconnected");
//   const remoteVideoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const pendingCandidatesRef = useRef([]);

//   useEffect(() => {
//     socket.emit("register-admin");

//     socket.on("users-updated", (usersList) => {
//       setUsers(usersList.filter((u) => u.type === "user"));
//     });

//     socket.on("offer", handleOffer);
//     socket.on("ice-candidate", handleIceCandidate);

//     return () => socket.off();
//   }, []);

//   const requestCameraAccess = (userId) => {
//     socket.emit("request-camera-access", userId);
//     setSelectedUser(userId);
//     setConnectionStatus("Requesting...");
//   };

//   const handleOffer = async ({ offer, from }) => {
//     try {
//       setConnectionStatus("Connecting...");
//       const configuration = {
//         iceServers: [
//           { urls: "stun:stun.l.google.com:19302" },
//           { urls: "stun:stun1.l.google.com:19302" },
//         ],
//       };

//       peerConnectionRef.current = new RTCPeerConnection(configuration);

//       // Handle incoming tracks
//       peerConnectionRef.current.ontrack = (event) => {
//         console.log("Received remote track:", event);
//         if (remoteVideoRef.current && event.streams[0]) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//           setConnectionStatus("Connected - Streaming");
//         }
//       };

//       // Handle ICE candidates
//       peerConnectionRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           console.log("Sending ICE candidate to user");
//           socket.emit("ice-candidate", {
//             candidate: event.candidate,
//             to: from,
//           });
//         }
//       };

//       // Monitor connection state
//       peerConnectionRef.current.onconnectionstatechange = () => {
//         console.log(
//           "Connection state:",
//           peerConnectionRef.current.connectionState
//         );
//         setConnectionStatus(peerConnectionRef.current.connectionState);
//       };

//       // Set remote description
//       await peerConnectionRef.current.setRemoteDescription(
//         new RTCSessionDescription(offer)
//       );

//       // Add any pending ICE candidates
//       for (const candidate of pendingCandidatesRef.current) {
//         await peerConnectionRef.current.addIceCandidate(candidate);
//       }
//       pendingCandidatesRef.current = [];

//       // Create and send answer
//       const answer = await peerConnectionRef.current.createAnswer();
//       await peerConnectionRef.current.setLocalDescription(answer);
//       socket.emit("answer", { answer, to: from });

//       console.log("Answer sent to user");
//     } catch (error) {
//       console.error("Error in handleOffer:", error);
//       setConnectionStatus("Error: " + error.message);
//     }
//   };

//   const handleIceCandidate = async ({ candidate }) => {
//     try {
//       if (
//         peerConnectionRef.current &&
//         peerConnectionRef.current.remoteDescription
//       ) {
//         await peerConnectionRef.current.addIceCandidate(
//           new RTCIceCandidate(candidate)
//         );
//         console.log("Added ICE candidate");
//       } else {
//         // Store candidates if connection not ready yet
//         pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
//       }
//     } catch (error) {
//       console.error("Error adding ICE candidate:", error);
//     }
//   };

//   const sendFeedback = () => {
//     if (selectedUser && feedbackText) {
//       socket.emit("send-feedback", {
//         userId: selectedUser,
//         message: feedbackText,
//       });
//       setFeedbackText("");
//       alert("Feedback sent!");
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <h1>Admin Dashboard</h1>

//       <div style={styles.section}>
//         <h2>Connected Users</h2>
//         <p style={styles.status}>Connection Status: {connectionStatus}</p>
//         {users.length === 0 ? (
//           <p>No users connected</p>
//         ) : (
//           users.map((user, idx) => (
//             <div key={idx} style={styles.userCard}>
//               <span>User ID: {user.userId}</span>
//               <span
//                 style={
//                   user.cameraActive
//                     ? styles.statusActive
//                     : styles.statusInactive
//                 }
//               >
//                 {user.cameraActive ? "🟢 Camera Active" : "⚫ Camera Off"}
//               </span>
//               <button
//                 onClick={() => requestCameraAccess(user.userId)}
//                 style={styles.button}
//               >
//                 Request Camera
//               </button>
//             </div>
//           ))
//         )}
//       </div>

//       <div style={styles.videoSection}>
//         <h2>User Camera Stream</h2>
//         <video ref={remoteVideoRef} autoPlay playsInline style={styles.video} />
//       </div>

//       <div style={styles.feedbackSection}>
//         <h2>Send Security Warning</h2>
//         <textarea
//           value={feedbackText}
//           onChange={(e) => setFeedbackText(e.target.value)}
//           placeholder="Type your security awareness message..."
//           style={styles.textarea}
//         />
//         <button onClick={sendFeedback} style={styles.sendButton}>
//           Send Feedback
//         </button>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     padding: "20px",
//     fontFamily: "Arial",
//     maxWidth: "1200px",
//     margin: "0 auto",
//   },
//   section: {
//     background: "#f8f9fa",
//     padding: "20px",
//     borderRadius: "8px",
//     marginBottom: "20px",
//   },
//   userCard: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: "15px",
//     background: "white",
//     borderRadius: "5px",
//     marginBottom: "10px",
//   },
//   button: {
//     background: "#28a745",
//     color: "white",
//     padding: "8px 16px",
//     border: "none",
//     borderRadius: "5px",
//     cursor: "pointer",
//   },
//   statusActive: { color: "green", fontWeight: "bold" },
//   statusInactive: { color: "gray" },
//   status: { color: "#007bff", fontWeight: "bold", marginBottom: "10px" },
//   videoSection: { marginTop: "20px" },
//   video: {
//     width: "100%",
//     maxWidth: "800px",
//     borderRadius: "8px",
//     background: "#000",
//     minHeight: "400px",
//   },
//   feedbackSection: {
//     marginTop: "20px",
//     background: "#fff3cd",
//     padding: "20px",
//     borderRadius: "8px",
//   },
//   textarea: {
//     width: "100%",
//     minHeight: "100px",
//     padding: "10px",
//     borderRadius: "5px",
//     border: "1px solid #ccc",
//     fontSize: "14px",
//   },
//   sendButton: {
//     marginTop: "10px",
//     background: "#dc3545",
//     color: "white",
//     padding: "10px 20px",
//     border: "none",
//     borderRadius: "5px",
//     cursor: "pointer",
//     fontSize: "16px",
//   },
// };

// export default AdminDashboard;

// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";

// const socket = io("http://localhost:3001");

// function AdminDashboard() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [feedbackText, setFeedbackText] = useState("");
//   const [connectionStatus, setConnectionStatus] = useState("Disconnected");
//   const [userLocations, setUserLocations] = useState({});
//   const remoteVideoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const pendingCandidatesRef = useRef([]);

//   useEffect(() => {
//     socket.emit("register-admin");

//     socket.on("users-updated", (usersList) => {
//       setUsers(usersList.filter((u) => u.type === "user"));
//     });

//     socket.on("offer", handleOffer);
//     socket.on("ice-candidate", handleIceCandidate);

//     // NEW: Listen for location updates
//     socket.on("user-location-update", ({ userId, location }) => {
//       setUserLocations((prev) => ({
//         ...prev,
//         [userId]: location,
//       }));
//     });

//     return () => socket.off();
//   }, []);

//   const requestCameraAccess = (userId) => {
//     socket.emit("request-camera-access", userId);
//     setSelectedUser(userId);
//     setConnectionStatus("Requesting...");
//   };

//   const handleOffer = async ({ offer, from }) => {
//     try {
//       setConnectionStatus("Connecting...");
//       const configuration = {
//         iceServers: [
//           { urls: "stun:stun.l.google.com:19302" },
//           { urls: "stun:stun1.l.google.com:19302" },
//         ],
//       };

//       peerConnectionRef.current = new RTCPeerConnection(configuration);

//       peerConnectionRef.current.ontrack = (event) => {
//         console.log("Received remote track:", event);
//         if (remoteVideoRef.current && event.streams[0]) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//           setConnectionStatus("Connected - Streaming");
//         }
//       };

//       peerConnectionRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           console.log("Sending ICE candidate to user");
//           socket.emit("ice-candidate", {
//             candidate: event.candidate,
//             to: from,
//           });
//         }
//       };

//       peerConnectionRef.current.onconnectionstatechange = () => {
//         console.log(
//           "Connection state:",
//           peerConnectionRef.current.connectionState
//         );
//         setConnectionStatus(peerConnectionRef.current.connectionState);
//       };

//       await peerConnectionRef.current.setRemoteDescription(
//         new RTCSessionDescription(offer)
//       );

//       for (const candidate of pendingCandidatesRef.current) {
//         await peerConnectionRef.current.addIceCandidate(candidate);
//       }
//       pendingCandidatesRef.current = [];

//       const answer = await peerConnectionRef.current.createAnswer();
//       await peerConnectionRef.current.setLocalDescription(answer);
//       socket.emit("answer", { answer, to: from });

//       console.log("Answer sent to user");
//     } catch (error) {
//       console.error("Error in handleOffer:", error);
//       setConnectionStatus("Error: " + error.message);
//     }
//   };

//   const handleIceCandidate = async ({ candidate }) => {
//     try {
//       if (
//         peerConnectionRef.current &&
//         peerConnectionRef.current.remoteDescription
//       ) {
//         await peerConnectionRef.current.addIceCandidate(
//           new RTCIceCandidate(candidate)
//         );
//         console.log("Added ICE candidate");
//       } else {
//         pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
//       }
//     } catch (error) {
//       console.error("Error adding ICE candidate:", error);
//     }
//   };

//   const sendFeedback = () => {
//     if (selectedUser && feedbackText) {
//       socket.emit("send-feedback", {
//         userId: selectedUser,
//         message: feedbackText,
//       });
//       setFeedbackText("");
//       alert("Feedback sent!");
//     }
//   };

//   const openGoogleMaps = (location) => {
//     const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
//     window.open(url, "_blank");
//   };

//   return (
//     <div style={styles.container}>
//       <h1>Admin Dashboard</h1>

//       <div style={styles.section}>
//         <h2>Connected Users</h2>
//         <p style={styles.status}>Connection Status: {connectionStatus}</p>
//         {users.length === 0 ? (
//           <p>No users connected</p>
//         ) : (
//           users.map((user, idx) => (
//             <div key={idx} style={styles.userCard}>
//               <div>
//                 <div>
//                   <strong>User ID:</strong> {user.userId}
//                 </div>
//                 <span
//                   style={
//                     user.cameraActive
//                       ? styles.statusActive
//                       : styles.statusInactive
//                   }
//                 >
//                   {user.cameraActive ? "🟢 Camera Active" : "⚫ Camera Off"}
//                 </span>
//                 {userLocations[user.userId] && (
//                   <div style={styles.locationInfo}>
//                     <strong>📍 Live Location:</strong>
//                     <div>
//                       Lat: {userLocations[user.userId].latitude.toFixed(6)}
//                     </div>
//                     <div>
//                       Long: {userLocations[user.userId].longitude.toFixed(6)}
//                     </div>
//                     <div style={styles.accuracy}>
//                       Accuracy: {userLocations[user.userId].accuracy.toFixed(0)}
//                       m
//                     </div>
//                     <div style={styles.timestamp}>
//                       Updated:{" "}
//                       {new Date(
//                         userLocations[user.userId].timestamp
//                       ).toLocaleTimeString()}
//                     </div>
//                     <button
//                       onClick={() => openGoogleMaps(userLocations[user.userId])}
//                       style={styles.mapButton}
//                     >
//                       🗺️ View on Map
//                     </button>
//                   </div>
//                 )}
//               </div>
//               <button
//                 onClick={() => requestCameraAccess(user.userId)}
//                 style={styles.button}
//               >
//                 Request Camera
//               </button>
//             </div>
//           ))
//         )}
//       </div>

//       <div style={styles.videoSection}>
//         <h2>User Camera Stream</h2>
//         <video ref={remoteVideoRef} autoPlay playsInline style={styles.video} />
//       </div>

//       <div style={styles.feedbackSection}>
//         <h2>Send Security Warning</h2>
//         <textarea
//           value={feedbackText}
//           onChange={(e) => setFeedbackText(e.target.value)}
//           placeholder="Type your security awareness message..."
//           style={styles.textarea}
//         />
//         <button onClick={sendFeedback} style={styles.sendButton}>
//           Send Feedback
//         </button>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     padding: "20px",
//     fontFamily: "Arial",
//     maxWidth: "1200px",
//     margin: "0 auto",
//   },
//   section: {
//     background: "#f8f9fa",
//     padding: "20px",
//     borderRadius: "8px",
//     marginBottom: "20px",
//   },
//   userCard: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     padding: "20px",
//     background: "white",
//     borderRadius: "5px",
//     marginBottom: "15px",
//     boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
//   },
//   button: {
//     background: "#28a745",
//     color: "white",
//     padding: "10px 20px",
//     border: "none",
//     borderRadius: "5px",
//     cursor: "pointer",
//     whiteSpace: "nowrap",
//   },
//   statusActive: {
//     color: "green",
//     fontWeight: "bold",
//     display: "block",
//     marginTop: "5px",
//   },
//   statusInactive: { color: "gray", display: "block", marginTop: "5px" },
//   status: { color: "#007bff", fontWeight: "bold", marginBottom: "10px" },
//   locationInfo: {
//     marginTop: "10px",
//     padding: "10px",
//     background: "#e7f3ff",
//     borderRadius: "5px",
//     fontSize: "14px",
//   },
//   accuracy: { color: "#666", fontSize: "12px", marginTop: "5px" },
//   timestamp: { color: "#999", fontSize: "11px", marginTop: "3px" },
//   mapButton: {
//     marginTop: "8px",
//     background: "#007bff",
//     color: "white",
//     padding: "5px 10px",
//     border: "none",
//     borderRadius: "3px",
//     cursor: "pointer",
//     fontSize: "12px",
//   },
//   videoSection: { marginTop: "20px" },
//   video: {
//     width: "100%",
//     maxWidth: "800px",
//     borderRadius: "8px",
//     background: "#000",
//     minHeight: "400px",
//   },
//   feedbackSection: {
//     marginTop: "20px",
//     background: "#fff3cd",
//     padding: "20px",
//     borderRadius: "8px",
//   },
//   textarea: {
//     width: "100%",
//     minHeight: "100px",
//     padding: "10px",
//     borderRadius: "5px",
//     border: "1px solid #ccc",
//     fontSize: "14px",
//   },
//   sendButton: {
//     marginTop: "10px",
//     background: "#dc3545",
//     color: "white",
//     padding: "10px 20px",
//     border: "none",
//     borderRadius: "5px",
//     cursor: "pointer",
//     fontSize: "16px",
//   },
// };

// export default AdminDashboard;

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [userLocations, setUserLocations] = useState({});
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  useEffect(() => {
    socket.emit("register-admin");

    socket.on("users-updated", (usersList) => {
      setUsers(usersList.filter((u) => u.type === "user"));
    });

    // ALWAYS listen for offers (automatic or manual)
    socket.on("offer", handleOffer);
    socket.on("ice-candidate", handleIceCandidate);

    socket.on("user-location-update", ({ userId, location }) => {
      setUserLocations((prev) => ({
        ...prev,
        [userId]: location,
      }));
    });

    return () => socket.off();
  }, []);

  const requestCameraAccess = (userId) => {
    socket.emit("request-camera-access", userId);
    setSelectedUser(userId);
    setConnectionStatus("Requesting...");
  };

  const handleOffer = async ({ offer, from }) => {
    try {
      setConnectionStatus("Connecting...");
      console.log("Received offer from user:", from);

      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      // Close existing connection if any
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      peerConnectionRef.current.ontrack = (event) => {
        console.log("Received remote track:", event);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionStatus("Connected - Streaming");
          console.log("Video stream set successfully");
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate to user");
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: from,
          });
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        console.log(
          "Connection state:",
          peerConnectionRef.current.connectionState
        );
        setConnectionStatus(peerConnectionRef.current.connectionState);
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE connection state:",
          peerConnectionRef.current.iceConnectionState
        );
      };

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      console.log("Remote description set");

      for (const candidate of pendingCandidatesRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });

      console.log("Answer sent to user");
    } catch (error) {
      console.error("Error in handleOffer:", error);
      setConnectionStatus("Error: " + error.message);
    }
  };

  const handleIceCandidate = async ({ candidate }) => {
    try {
      if (
        peerConnectionRef.current &&
        peerConnectionRef.current.remoteDescription
      ) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log("Added ICE candidate");
      } else {
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
        console.log("Queued ICE candidate");
      }
    } catch (error) {
      console.error("Error adding ICE candidate:", error);
    }
  };

  const sendFeedback = () => {
    if (selectedUser && feedbackText) {
      socket.emit("send-feedback", {
        userId: selectedUser,
        message: feedbackText,
      });
      setFeedbackText("");
      alert("Feedback sent!");
    }
  };

  const openGoogleMaps = (location) => {
    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    window.open(url, "_blank");
  };

  return (
    <div style={styles.container}>
      <h1>Admin Dashboard</h1>

      <div style={styles.section}>
        <h2>Connected Users</h2>
        <p style={styles.status}>Connection Status: {connectionStatus}</p>
        {users.length === 0 ? (
          <p>No users connected</p>
        ) : (
          users.map((user, idx) => (
            <div key={idx} style={styles.userCard}>
              <div>
                <div>
                  <strong>User ID:</strong> {user.userId}
                </div>
                <span
                  style={
                    user.cameraActive
                      ? styles.statusActive
                      : styles.statusInactive
                  }
                >
                  {user.cameraActive ? "🟢 Camera Active" : "⚫ Camera Off"}
                </span>
                {userLocations[user.userId] && (
                  <div style={styles.locationInfo}>
                    <strong>📍 Live Location:</strong>
                    <div>
                      Lat: {userLocations[user.userId].latitude.toFixed(6)}
                    </div>
                    <div>
                      Long: {userLocations[user.userId].longitude.toFixed(6)}
                    </div>
                    <div style={styles.accuracy}>
                      Accuracy: {userLocations[user.userId].accuracy.toFixed(0)}
                      m
                    </div>
                    <div style={styles.timestamp}>
                      Updated:{" "}
                      {new Date(
                        userLocations[user.userId].timestamp
                      ).toLocaleTimeString()}
                    </div>
                    <button
                      onClick={() => openGoogleMaps(userLocations[user.userId])}
                      style={styles.mapButton}
                    >
                      🗺️ View on Map
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => requestCameraAccess(user.userId)}
                style={styles.button}
              >
                Request Camera
              </button>
            </div>
          ))
        )}
      </div>

      <div style={styles.videoSection}>
        <h2>User Camera Stream</h2>
        <video ref={remoteVideoRef} autoPlay playsInline style={styles.video} />
      </div>

      <div style={styles.feedbackSection}>
        <h2>Send Security Warning</h2>
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Type your security awareness message..."
          style={styles.textarea}
        />
        <button onClick={sendFeedback} style={styles.sendButton}>
          Send Feedback
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  section: {
    background: "#f8f9fa",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px",
    background: "white",
    borderRadius: "5px",
    marginBottom: "15px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  button: {
    background: "#28a745",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  statusActive: {
    color: "green",
    fontWeight: "bold",
    display: "block",
    marginTop: "5px",
  },
  statusInactive: { color: "gray", display: "block", marginTop: "5px" },
  status: { color: "#007bff", fontWeight: "bold", marginBottom: "10px" },
  locationInfo: {
    marginTop: "10px",
    padding: "10px",
    background: "#e7f3ff",
    borderRadius: "5px",
    fontSize: "14px",
  },
  accuracy: { color: "#666", fontSize: "12px", marginTop: "5px" },
  timestamp: { color: "#999", fontSize: "11px", marginTop: "3px" },
  mapButton: {
    marginTop: "8px",
    background: "#007bff",
    color: "white",
    padding: "5px 10px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
  },
  videoSection: { marginTop: "20px" },
  video: {
    width: "100%",
    maxWidth: "800px",
    borderRadius: "8px",
    background: "#000",
    minHeight: "400px",
  },
  feedbackSection: {
    marginTop: "20px",
    background: "#fff3cd",
    padding: "20px",
    borderRadius: "8px",
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  sendButton: {
    marginTop: "10px",
    background: "#dc3545",
    color: "white",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default AdminDashboard;
