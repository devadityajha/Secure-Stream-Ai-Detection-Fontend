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

//////////////////
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

//     // ALWAYS listen for offers (automatic or manual)
//     socket.on("offer", handleOffer);
//     socket.on("ice-candidate", handleIceCandidate);

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
//       console.log("Received offer from user:", from);

//       const configuration = {
//         iceServers: [
//           { urls: "stun:stun.l.google.com:19302" },
//           { urls: "stun:stun1.l.google.com:19302" },
//         ],
//       };

//       // Close existing connection if any
//       if (peerConnectionRef.current) {
//         peerConnectionRef.current.close();
//       }

//       peerConnectionRef.current = new RTCPeerConnection(configuration);

//       peerConnectionRef.current.ontrack = (event) => {
//         console.log("Received remote track:", event);
//         if (remoteVideoRef.current && event.streams[0]) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//           setConnectionStatus("Connected - Streaming");
//           console.log("Video stream set successfully");
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

//       peerConnectionRef.current.oniceconnectionstatechange = () => {
//         console.log(
//           "ICE connection state:",
//           peerConnectionRef.current.iceConnectionState
//         );
//       };

//       await peerConnectionRef.current.setRemoteDescription(
//         new RTCSessionDescription(offer)
//       );
//       console.log("Remote description set");

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
//         console.log("Queued ICE candidate");
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
/////////////////////////////////////////////////////////////////////////////
// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Polyline,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // Fix for default marker icons in React-Leaflet
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//   iconUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// });

// const socket = io("http://localhost:3001");

// // Custom student marker icon
// const studentIcon = new L.Icon({
//   iconUrl:
//     "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNSIgZmlsbD0iI2Y0NDMzNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+8J+OkzwvdGV4dD48L3N2Zz4=",
//   iconSize: [32, 32],
//   iconAnchor: [16, 32],
//   popupAnchor: [0, -32],
// });

// function AdminDashboard() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [feedbackText, setFeedbackText] = useState("");
//   const [connectionStatus, setConnectionStatus] = useState("Disconnected");
//   const [userLocations, setUserLocations] = useState({});
//   const [locationHistory, setLocationHistory] = useState({});
//   const [mapCenter, setMapCenter] = useState([28.569047, 77.015455]); // Default Delhi
//   const remoteVideoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const pendingCandidatesRef = useRef([]);
//   const mapRef = useRef(null);

//   useEffect(() => {
//     socket.emit("register-admin");

//     socket.on("users-updated", (usersList) => {
//       setUsers(usersList.filter((u) => u.type === "user"));
//     });

//     socket.on("offer", handleOffer);
//     socket.on("ice-candidate", handleIceCandidate);

//     socket.on("user-location-update", ({ userId, location }) => {
//       setUserLocations((prev) => ({
//         ...prev,
//         [userId]: location,
//       }));

//       // Update location history for path tracking
//       setLocationHistory((prev) => ({
//         ...prev,
//         [userId]: [
//           ...(prev[userId] || []),
//           [location.latitude, location.longitude],
//         ],
//       }));

//       // Center map on first location update
//       if (Object.keys(userLocations).length === 0) {
//         setMapCenter([location.latitude, location.longitude]);
//       }
//     });

//     return () => socket.off();
//   }, []);

//   const handleOffer = async ({ offer, from }) => {
//     try {
//       setConnectionStatus("Connecting...");
//       const configuration = {
//         iceServers: [
//           { urls: "stun:stun.l.google.com:19302" },
//           { urls: "stun:stun1.l.google.com:19302" },
//         ],
//       };

//       if (peerConnectionRef.current) {
//         peerConnectionRef.current.close();
//       }

//       peerConnectionRef.current = new RTCPeerConnection(configuration);

//       peerConnectionRef.current.ontrack = (event) => {
//         if (remoteVideoRef.current && event.streams[0]) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//           setConnectionStatus("🟢 Live");
//         }
//       };

//       peerConnectionRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             candidate: event.candidate,
//             to: from,
//           });
//         }
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
//     } catch (error) {
//       console.error("Error in handleOffer:", error);
//       setConnectionStatus("Error");
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
//       alert("Alert sent to student!");
//     }
//   };

//   const openGoogleMaps = (location) => {
//     const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
//     window.open(url, "_blank");
//   };

//   const calculateDistance = (path) => {
//     if (!path || path.length < 2) return 0;

//     let total = 0;
//     for (let i = 0; i < path.length - 1; i++) {
//       const R = 6371e3; // Earth radius in meters
//       const φ1 = (path[i][0] * Math.PI) / 180;
//       const φ2 = (path[i + 1][0] * Math.PI) / 180;
//       const Δφ = ((path[i + 1][0] - path[i][0]) * Math.PI) / 180;
//       const Δλ = ((path[i + 1][1] - path[i][1]) * Math.PI) / 180;

//       const a =
//         Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//         Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//       total += R * c;
//     }
//     return total;
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.sidebar}>
//         <div style={styles.logo}>
//           <span style={styles.logoIcon}>🎓</span>
//           <span style={styles.logoText}>SecureStream AI</span>
//         </div>

//         <div style={styles.statsGrid}>
//           <div style={styles.statCard}>
//             <div style={styles.statNumber}>{users.length}</div>
//             <div style={styles.statLabel}>Active Students</div>
//           </div>
//           <div style={styles.statCard}>
//             <div style={styles.statNumber}>
//               {users.filter((u) => u.cameraActive).length}
//             </div>
//             <div style={styles.statLabel}>Monitored</div>
//           </div>
//         </div>

//         <div style={styles.section}>
//           <h3 style={styles.sectionTitle}>📹 Live Sessions</h3>
//           {users.length === 0 ? (
//             <p style={styles.emptyText}>No students online</p>
//           ) : (
//             users.map((user, idx) => (
//               <div
//                 key={idx}
//                 style={styles.studentCard}
//                 onClick={() => setSelectedUser(user.userId)}
//               >
//                 <div style={styles.studentInfo}>
//                   <div style={styles.studentAvatar}>👤</div>
//                   <div>
//                     <div style={styles.studentId}>{user.userId}</div>
//                     <div
//                       style={
//                         user.cameraActive
//                           ? styles.statusOnline
//                           : styles.statusOffline
//                       }
//                     >
//                       {user.cameraActive ? "🟢 Camera Active" : "⚫ Offline"}
//                     </div>
//                   </div>
//                 </div>

//                 {userLocations[user.userId] && (
//                   <div style={styles.locationBadge}>📍 Tracked</div>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       <div style={styles.mainContent}>
//         <div style={styles.header}>
//           <h1 style={styles.pageTitle}>Proctor Dashboard</h1>
//           <div style={styles.statusBadge}>{connectionStatus}</div>
//         </div>

//         <div style={styles.gridContainer}>
//           <div style={styles.videoCard}>
//             <div style={styles.cardHeader}>
//               <h3 style={styles.cardTitle}>🎥 Live Student Camera</h3>
//             </div>
//             <div style={styles.videoWrapper}>
//               <video
//                 ref={remoteVideoRef}
//                 autoPlay
//                 playsInline
//                 style={styles.video}
//               />
//               {connectionStatus !== "🟢 Live" && (
//                 <div style={styles.videoOverlay}>
//                   <div style={styles.overlayIcon}>📹</div>
//                   <div style={styles.overlayText}>Waiting for student...</div>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div style={styles.mapCard}>
//             <div style={styles.cardHeader}>
//               <h3 style={styles.cardTitle}>🗺️ Live Location Tracking</h3>
//             </div>
//             <div style={styles.mapWrapper}>
//               {Object.keys(userLocations).length === 0 ? (
//                 <div style={styles.mapPlaceholder}>
//                   <div style={styles.mapIcon}>📍</div>
//                   <div style={styles.mapText}>No location data available</div>
//                   <div style={styles.mapSubtext}>
//                     Students will appear here when they log in
//                   </div>
//                 </div>
//               ) : (
//                 <MapContainer
//                   center={mapCenter}
//                   zoom={15}
//                   style={{
//                     height: "100%",
//                     width: "100%",
//                     borderRadius: "10px",
//                   }}
//                   ref={mapRef}
//                 >
//                   <TileLayer
//                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                   />

//                   {Object.entries(userLocations).map(([userId, location]) => (
//                     <div key={userId}>
//                       <Marker
//                         position={[location.latitude, location.longitude]}
//                         icon={studentIcon}
//                       >
//                         <Popup>
//                           <div style={styles.popupContent}>
//                             <strong>👤 {userId}</strong>
//                             <div style={styles.popupDetails}>
//                               <div>📍 Lat: {location.latitude.toFixed(6)}</div>
//                               <div>📍 Lng: {location.longitude.toFixed(6)}</div>
//                               <div>
//                                 🎯 Accuracy: {location.accuracy.toFixed(0)}m
//                               </div>
//                               <div>
//                                 🕒{" "}
//                                 {new Date(
//                                   location.timestamp
//                                 ).toLocaleTimeString()}
//                               </div>
//                             </div>
//                             <button
//                               onClick={() => openGoogleMaps(location)}
//                               style={styles.popupButton}
//                             >
//                               Open in Google Maps
//                             </button>
//                           </div>
//                         </Popup>
//                       </Marker>

//                       {locationHistory[userId] &&
//                         locationHistory[userId].length > 1 && (
//                           <Polyline
//                             positions={locationHistory[userId]}
//                             color="#f44336"
//                             weight={3}
//                             opacity={0.7}
//                           />
//                         )}
//                     </div>
//                   ))}
//                 </MapContainer>
//               )}
//             </div>

//             {/* Location Stats */}
//             {Object.entries(userLocations).map(([userId, location]) => (
//               <div key={userId} style={styles.locationStats}>
//                 <div style={styles.statItem}>
//                   <span style={styles.statLabel}>Student:</span>
//                   <span style={styles.statValue}>{userId}</span>
//                 </div>
//                 <div style={styles.statItem}>
//                   <span style={styles.statLabel}>Distance Traveled:</span>
//                   <span style={styles.statValue}>
//                     {calculateDistance(locationHistory[userId]).toFixed(0)}m
//                   </span>
//                 </div>
//                 <div style={styles.statItem}>
//                   <span style={styles.statLabel}>Updates:</span>
//                   <span style={styles.statValue}>
//                     {locationHistory[userId]?.length || 0}
//                   </span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         <div style={styles.alertCard}>
//           <h3 style={styles.cardTitle}>📢 Send Alert to Student</h3>
//           <select
//             value={selectedUser || ""}
//             onChange={(e) => setSelectedUser(e.target.value)}
//             style={styles.selectUser}
//           >
//             <option value="">Select Student</option>
//             {users.map((user, idx) => (
//               <option key={idx} value={user.userId}>
//                 {user.userId}
//               </option>
//             ))}
//           </select>
//           <textarea
//             value={feedbackText}
//             onChange={(e) => setFeedbackText(e.target.value)}
//             placeholder="Type warning message (e.g., 'Please keep your eyes on the screen')"
//             style={styles.textarea}
//           />
//           <button onClick={sendFeedback} style={styles.sendButton}>
//             📤 Send Alert
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     display: "flex",
//     minHeight: "100vh",
//     background: "#f5f7fa",
//     fontFamily:
//       "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
//   },
//   sidebar: {
//     width: "320px",
//     background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
//     color: "white",
//     padding: "30px 20px",
//     boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
//     overflowY: "auto",
//   },
//   logo: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     marginBottom: "30px",
//     paddingBottom: "20px",
//     borderBottom: "1px solid rgba(255,255,255,0.2)",
//   },
//   logoIcon: {
//     fontSize: "32px",
//   },
//   logoText: {
//     fontSize: "20px",
//     fontWeight: "700",
//   },
//   statsGrid: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "15px",
//     marginBottom: "30px",
//   },
//   statCard: {
//     background: "rgba(255,255,255,0.15)",
//     padding: "20px",
//     borderRadius: "12px",
//     textAlign: "center",
//   },
//   statNumber: {
//     fontSize: "32px",
//     fontWeight: "700",
//     marginBottom: "5px",
//   },
//   statLabel: {
//     fontSize: "12px",
//     opacity: 0.9,
//   },
//   section: {
//     marginBottom: "25px",
//   },
//   sectionTitle: {
//     fontSize: "14px",
//     fontWeight: "600",
//     marginBottom: "15px",
//     opacity: 0.9,
//   },
//   emptyText: {
//     fontSize: "13px",
//     opacity: 0.7,
//     textAlign: "center",
//     padding: "20px",
//   },
//   studentCard: {
//     background: "rgba(255,255,255,0.1)",
//     padding: "15px",
//     borderRadius: "10px",
//     marginBottom: "10px",
//     backdropFilter: "blur(10px)",
//     cursor: "pointer",
//     transition: "all 0.3s",
//   },
//   studentInfo: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     marginBottom: "8px",
//   },
//   studentAvatar: {
//     width: "40px",
//     height: "40px",
//     background: "rgba(255,255,255,0.2)",
//     borderRadius: "50%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "20px",
//   },
//   studentId: {
//     fontSize: "13px",
//     fontWeight: "600",
//   },
//   statusOnline: {
//     fontSize: "11px",
//     color: "#4caf50",
//   },
//   statusOffline: {
//     fontSize: "11px",
//     opacity: 0.7,
//   },
//   locationBadge: {
//     fontSize: "11px",
//     background: "rgba(255,255,255,0.2)",
//     padding: "4px 10px",
//     borderRadius: "20px",
//     display: "inline-block",
//   },
//   mainContent: {
//     flex: 1,
//     padding: "30px",
//     overflowY: "auto",
//   },
//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: "30px",
//   },
//   pageTitle: {
//     fontSize: "28px",
//     fontWeight: "700",
//     color: "#1a1a1a",
//     margin: 0,
//   },
//   statusBadge: {
//     padding: "8px 16px",
//     background: "white",
//     borderRadius: "20px",
//     fontSize: "14px",
//     fontWeight: "600",
//     boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//   },
//   gridContainer: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "20px",
//     marginBottom: "20px",
//   },
//   videoCard: {
//     background: "white",
//     borderRadius: "15px",
//     overflow: "hidden",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
//   },
//   mapCard: {
//     background: "white",
//     borderRadius: "15px",
//     overflow: "hidden",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
//   },
//   cardHeader: {
//     padding: "20px",
//     borderBottom: "1px solid #f0f0f0",
//   },
//   cardTitle: {
//     fontSize: "16px",
//     fontWeight: "600",
//     color: "#333",
//     margin: 0,
//   },
//   videoWrapper: {
//     position: "relative",
//     paddingTop: "56.25%",
//     background: "#000",
//   },
//   video: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     width: "100%",
//     height: "100%",
//     objectFit: "cover",
//   },
//   videoOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     width: "100%",
//     height: "100%",
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     background: "rgba(0,0,0,0.7)",
//   },
//   overlayIcon: {
//     fontSize: "64px",
//     marginBottom: "15px",
//   },
//   overlayText: {
//     color: "white",
//     fontSize: "16px",
//   },
//   mapWrapper: {
//     height: "400px",
//     position: "relative",
//   },
//   mapPlaceholder: {
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     height: "100%",
//     color: "#999",
//   },
//   mapIcon: {
//     fontSize: "64px",
//     marginBottom: "15px",
//   },
//   mapText: {
//     fontSize: "16px",
//     fontWeight: "600",
//     marginBottom: "5px",
//   },
//   mapSubtext: {
//     fontSize: "13px",
//   },
//   popupContent: {
//     fontSize: "12px",
//   },
//   popupDetails: {
//     margin: "10px 0",
//     lineHeight: "1.6",
//   },
//   popupButton: {
//     width: "100%",
//     padding: "6px",
//     background: "#667eea",
//     color: "white",
//     border: "none",
//     borderRadius: "4px",
//     fontSize: "11px",
//     cursor: "pointer",
//   },
//   locationStats: {
//     padding: "15px 20px",
//     borderTop: "1px solid #f0f0f0",
//     display: "flex",
//     justifyContent: "space-around",
//     gap: "15px",
//   },
//   statItem: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "4px",
//   },
//   statLabel: {
//     fontSize: "11px",
//     color: "#666",
//     textTransform: "uppercase",
//   },
//   statValue: {
//     fontSize: "14px",
//     fontWeight: "600",
//     color: "#333",
//   },
//   alertCard: {
//     background: "white",
//     padding: "25px",
//     borderRadius: "15px",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
//   },
//   selectUser: {
//     width: "100%",
//     padding: "12px",
//     border: "1px solid #e0e0e0",
//     borderRadius: "8px",
//     fontSize: "14px",
//     marginTop: "15px",
//     marginBottom: "15px",
//   },
//   textarea: {
//     width: "100%",
//     minHeight: "100px",
//     padding: "15px",
//     border: "1px solid #e0e0e0",
//     borderRadius: "10px",
//     fontSize: "14px",
//     fontFamily: "inherit",
//     resize: "vertical",
//     marginBottom: "15px",
//   },
//   sendButton: {
//     padding: "12px 30px",
//     background: "#f44336",
//     color: "white",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "14px",
//     fontWeight: "600",
//     cursor: "pointer",
//   },
// };

// export default AdminDashboard;

// ////////////////////////////////////
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

//     socket.on("user-location-update", ({ userId, location }) => {
//       setUserLocations((prev) => ({
//         ...prev,
//         [userId]: location,
//       }));
//     });

//     return () => socket.off();
//   }, []);

//   const handleOffer = async ({ offer, from }) => {
//     try {
//       setConnectionStatus("Connecting...");
//       const configuration = {
//         iceServers: [
//           { urls: "stun:stun.l.google.com:19302" },
//           { urls: "stun:stun1.l.google.com:19302" },
//         ],
//       };

//       if (peerConnectionRef.current) {
//         peerConnectionRef.current.close();
//       }

//       peerConnectionRef.current = new RTCPeerConnection(configuration);

//       peerConnectionRef.current.ontrack = (event) => {
//         if (remoteVideoRef.current && event.streams[0]) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//           setConnectionStatus("🟢 Live");
//         }
//       };

//       peerConnectionRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             candidate: event.candidate,
//             to: from,
//           });
//         }
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
//     } catch (error) {
//       console.error("Error in handleOffer:", error);
//       setConnectionStatus("Error");
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
//       alert("Alert sent to student!");
//     }
//   };

//   const openGoogleMaps = (location) => {
//     const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
//     window.open(url, "_blank");
//   };

//   return (
//     <div style={styles.container}>
//       <div style={styles.sidebar}>
//         <div style={styles.logo}>
//           <span style={styles.logoIcon}>🎓</span>
//           <span style={styles.logoText}>SecureStream AI</span>
//         </div>

//         <div style={styles.statsGrid}>
//           <div style={styles.statCard}>
//             <div style={styles.statNumber}>{users.length}</div>
//             <div style={styles.statLabel}>Active Students</div>
//           </div>
//           <div style={styles.statCard}>
//             <div style={styles.statNumber}>
//               {users.filter((u) => u.cameraActive).length}
//             </div>
//             <div style={styles.statLabel}>Monitored</div>
//           </div>
//         </div>

//         <div style={styles.section}>
//           <h3 style={styles.sectionTitle}>📹 Live Sessions</h3>
//           {users.length === 0 ? (
//             <p style={styles.emptyText}>No students online</p>
//           ) : (
//             users.map((user, idx) => (
//               <div key={idx} style={styles.studentCard}>
//                 <div style={styles.studentInfo}>
//                   <div style={styles.studentAvatar}>👤</div>
//                   <div>
//                     <div style={styles.studentId}>{user.userId}</div>
//                     <div
//                       style={
//                         user.cameraActive
//                           ? styles.statusOnline
//                           : styles.statusOffline
//                       }
//                     >
//                       {user.cameraActive ? "🟢 Camera Active" : "⚫ Offline"}
//                     </div>
//                   </div>
//                 </div>

//                 {userLocations[user.userId] && (
//                   <div style={styles.locationBadge}>📍 Tracked</div>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       <div style={styles.mainContent}>
//         <div style={styles.header}>
//           <h1 style={styles.pageTitle}>Proctor Dashboard</h1>
//           <div style={styles.statusBadge}>{connectionStatus}</div>
//         </div>

//         <div style={styles.gridContainer}>
//           <div style={styles.videoCard}>
//             <div style={styles.cardHeader}>
//               <h3 style={styles.cardTitle}>🎥 Live Student Camera</h3>
//             </div>
//             <div style={styles.videoWrapper}>
//               <video
//                 ref={remoteVideoRef}
//                 autoPlay
//                 playsInline
//                 style={styles.video}
//               />
//               {connectionStatus !== "🟢 Live" && (
//                 <div style={styles.videoOverlay}>
//                   <div style={styles.overlayIcon}>📹</div>
//                   <div style={styles.overlayText}>Waiting for student...</div>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div style={styles.mapCard}>
//             <div style={styles.cardHeader}>
//               <h3 style={styles.cardTitle}>🗺️ Live Location Tracking</h3>
//             </div>
//             <div style={styles.mapContainer}>
//               {Object.keys(userLocations).length === 0 ? (
//                 <div style={styles.mapPlaceholder}>
//                   <div style={styles.mapIcon}>📍</div>
//                   <div style={styles.mapText}>No location data available</div>
//                 </div>
//               ) : (
//                 <div style={styles.locationList}>
//                   {Object.entries(userLocations).map(([userId, location]) => (
//                     <div key={userId} style={styles.locationCard}>
//                       <div style={styles.locationHeader}>
//                         <span style={styles.locationUser}>👤 {userId}</span>
//                         <span style={styles.locationLive}>🔴 LIVE</span>
//                       </div>
//                       <div style={styles.locationData}>
//                         <div style={styles.coordItem}>
//                           <span style={styles.coordLabel}>Latitude:</span>
//                           <span style={styles.coordValue}>
//                             {location.latitude.toFixed(6)}
//                           </span>
//                         </div>
//                         <div style={styles.coordItem}>
//                           <span style={styles.coordLabel}>Longitude:</span>
//                           <span style={styles.coordValue}>
//                             {location.longitude.toFixed(6)}
//                           </span>
//                         </div>
//                         <div style={styles.coordItem}>
//                           <span style={styles.coordLabel}>Accuracy:</span>
//                           <span style={styles.coordValue}>
//                             {location.accuracy.toFixed(0)}m
//                           </span>
//                         </div>
//                         <div style={styles.coordItem}>
//                           <span style={styles.coordLabel}>Last Update:</span>
//                           <span style={styles.coordValue}>
//                             {new Date(location.timestamp).toLocaleTimeString()}
//                           </span>
//                         </div>
//                       </div>
//                       <button
//                         onClick={() => openGoogleMaps(location)}
//                         style={styles.mapButton}
//                       >
//                         🗺️ View on Google Maps
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div style={styles.alertCard}>
//           <h3 style={styles.cardTitle}>📢 Send Alert to Student</h3>
//           <textarea
//             value={feedbackText}
//             onChange={(e) => setFeedbackText(e.target.value)}
//             placeholder="Type warning message (e.g., 'Please keep your eyes on the screen')"
//             style={styles.textarea}
//           />
//           <button onClick={sendFeedback} style={styles.sendButton}>
//             Send Alert
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     display: "flex",
//     minHeight: "100vh",
//     background: "#f5f7fa",
//     fontFamily:
//       "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
//   },
//   sidebar: {
//     width: "320px",
//     background: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
//     color: "white",
//     padding: "30px 20px",
//     boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
//   },
//   logo: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     marginBottom: "30px",
//     paddingBottom: "20px",
//     borderBottom: "1px solid rgba(255,255,255,0.2)",
//   },
//   logoIcon: {
//     fontSize: "32px",
//   },
//   logoText: {
//     fontSize: "20px",
//     fontWeight: "700",
//   },
//   statsGrid: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "15px",
//     marginBottom: "30px",
//   },
//   statCard: {
//     background: "rgba(255,255,255,0.15)",
//     padding: "20px",
//     borderRadius: "12px",
//     textAlign: "center",
//   },
//   statNumber: {
//     fontSize: "32px",
//     fontWeight: "700",
//     marginBottom: "5px",
//   },
//   statLabel: {
//     fontSize: "12px",
//     opacity: 0.9,
//   },
//   section: {
//     marginBottom: "25px",
//   },
//   sectionTitle: {
//     fontSize: "14px",
//     fontWeight: "600",
//     marginBottom: "15px",
//     opacity: 0.9,
//   },
//   emptyText: {
//     fontSize: "13px",
//     opacity: 0.7,
//     textAlign: "center",
//     padding: "20px",
//   },
//   studentCard: {
//     background: "rgba(255,255,255,0.1)",
//     padding: "15px",
//     borderRadius: "10px",
//     marginBottom: "10px",
//     backdropFilter: "blur(10px)",
//   },
//   studentInfo: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     marginBottom: "8px",
//   },
//   studentAvatar: {
//     width: "40px",
//     height: "40px",
//     background: "rgba(255,255,255,0.2)",
//     borderRadius: "50%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontSize: "20px",
//   },
//   studentId: {
//     fontSize: "13px",
//     fontWeight: "600",
//   },
//   statusOnline: {
//     fontSize: "11px",
//     color: "#4caf50",
//   },
//   statusOffline: {
//     fontSize: "11px",
//     opacity: 0.7,
//   },
//   locationBadge: {
//     fontSize: "11px",
//     background: "rgba(255,255,255,0.2)",
//     padding: "4px 10px",
//     borderRadius: "20px",
//     display: "inline-block",
//   },
//   mainContent: {
//     flex: 1,
//     padding: "30px",
//     overflowY: "auto",
//   },
//   header: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: "30px",
//   },
//   pageTitle: {
//     fontSize: "28px",
//     fontWeight: "700",
//     color: "#1a1a1a",
//     margin: 0,
//   },
//   statusBadge: {
//     padding: "8px 16px",
//     background: "white",
//     borderRadius: "20px",
//     fontSize: "14px",
//     fontWeight: "600",
//     boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//   },
//   gridContainer: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "20px",
//     marginBottom: "20px",
//   },
//   videoCard: {
//     background: "white",
//     borderRadius: "15px",
//     overflow: "hidden",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
//   },
//   mapCard: {
//     background: "white",
//     borderRadius: "15px",
//     overflow: "hidden",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
//   },
//   cardHeader: {
//     padding: "20px",
//     borderBottom: "1px solid #f0f0f0",
//   },
//   cardTitle: {
//     fontSize: "16px",
//     fontWeight: "600",
//     color: "#333",
//     margin: 0,
//   },
//   videoWrapper: {
//     position: "relative",
//     paddingTop: "56.25%", // 16:9 aspect ratio
//     background: "#000",
//   },
//   video: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     width: "100%",
//     height: "100%",
//     objectFit: "cover",
//   },
//   videoOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     width: "100%",
//     height: "100%",
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     background: "rgba(0,0,0,0.7)",
//   },
//   overlayIcon: {
//     fontSize: "64px",
//     marginBottom: "15px",
//   },
//   overlayText: {
//     color: "white",
//     fontSize: "16px",
//   },
//   mapContainer: {
//     padding: "20px",
//     minHeight: "300px",
//   },
//   mapPlaceholder: {
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     height: "300px",
//     color: "#999",
//   },
//   mapIcon: {
//     fontSize: "64px",
//     marginBottom: "15px",
//   },
//   mapText: {
//     fontSize: "14px",
//   },
//   locationList: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "15px",
//   },
//   locationCard: {
//     background: "#f8f9fa",
//     padding: "15px",
//     borderRadius: "10px",
//     border: "1px solid #e0e0e0",
//   },
//   locationHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginBottom: "12px",
//   },
//   locationUser: {
//     fontSize: "14px",
//     fontWeight: "600",
//     color: "#333",
//   },
//   locationLive: {
//     fontSize: "12px",
//     color: "#f44336",
//     fontWeight: "600",
//   },
//   locationData: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "10px",
//     marginBottom: "12px",
//   },
//   coordItem: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "4px",
//   },
//   coordLabel: {
//     fontSize: "11px",
//     color: "#666",
//     textTransform: "uppercase",
//   },
//   coordValue: {
//     fontSize: "13px",
//     fontWeight: "600",
//     color: "#333",
//   },
//   mapButton: {
//     width: "100%",
//     padding: "10px",
//     background: "#667eea",
//     color: "white",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "13px",
//     fontWeight: "600",
//     cursor: "pointer",
//   },
//   alertCard: {
//     background: "white",
//     padding: "25px",
//     borderRadius: "15px",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
//   },
//   textarea: {
//     width: "100%",
//     minHeight: "100px",
//     padding: "15px",
//     border: "1px solid #e0e0e0",
//     borderRadius: "10px",
//     fontSize: "14px",
//     fontFamily: "inherit",
//     resize: "vertical",
//     marginTop: "15px",
//     marginBottom: "15px",
//   },
//   sendButton: {
//     padding: "12px 30px",
//     background: "#f44336",
//     color: "white",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "14px",
//     fontWeight: "600",
//     cursor: "pointer",
//   },
// };

// export default AdminDashboard;

// /////////////////////////////////best but location live showign kaam ni kr raha
// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Polyline,
//   useMap,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // Fix for default marker icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//   iconUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// });

// const socket = io("http://localhost:3001");

// // Custom animated student marker
// const studentIcon = new L.DivIcon({
//   className: "custom-marker",
//   html: `
//     <div style="
//       width: 40px;
//       height: 40px;
//       background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);
//       border: 4px solid white;
//       border-radius: 50%;
//       box-shadow: 0 4px 15px rgba(244, 67, 54, 0.5);
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 20px;
//       animation: pulse 2s infinite;
//     ">
//       📍
//     </div>
//     <style>
//       @keyframes pulse {
//         0%, 100% { transform: scale(1); }
//         50% { transform: scale(1.1); }
//       }
//     </style>
//   `,
//   iconSize: [40, 40],
//   iconAnchor: [20, 40],
//   popupAnchor: [0, -40],
// });

// // Component to auto-center map on markers
// function MapController({ center }) {
//   const map = useMap();
//   useEffect(() => {
//     if (center) {
//       map.setView(center, 15);
//     }
//   }, [center, map]);
//   return null;
// }

// function AdminDashboard() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [feedbackText, setFeedbackText] = useState("");
//   const [connectionStatus, setConnectionStatus] = useState("Disconnected");
//   const [userLocations, setUserLocations] = useState({});
//   const [locationHistory, setLocationHistory] = useState({});
//   const [mapCenter, setMapCenter] = useState([28.569047, 77.015455]);
//   const [showFullscreen, setShowFullscreen] = useState(false);
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

//     socket.on("user-location-update", ({ userId, location }) => {
//       setUserLocations((prev) => ({
//         ...prev,
//         [userId]: location,
//       }));

//       setLocationHistory((prev) => ({
//         ...prev,
//         [userId]: [
//           ...(prev[userId] || []),
//           [location.latitude, location.longitude],
//         ],
//       }));

//       if (Object.keys(userLocations).length === 0) {
//         setMapCenter([location.latitude, location.longitude]);
//       }
//     });

//     return () => socket.off();
//   }, []);

//   const handleOffer = async ({ offer, from }) => {
//     try {
//       setConnectionStatus("connecting");
//       const configuration = {
//         iceServers: [
//           { urls: "stun:stun.l.google.com:19302" },
//           { urls: "stun:stun1.l.google.com:19302" },
//         ],
//       };

//       if (peerConnectionRef.current) {
//         peerConnectionRef.current.close();
//       }

//       peerConnectionRef.current = new RTCPeerConnection(configuration);

//       peerConnectionRef.current.ontrack = (event) => {
//         if (remoteVideoRef.current && event.streams[0]) {
//           remoteVideoRef.current.srcObject = event.streams[0];
//           setConnectionStatus("live");
//         }
//       };

//       peerConnectionRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             candidate: event.candidate,
//             to: from,
//           });
//         }
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
//     } catch (error) {
//       console.error("Error in handleOffer:", error);
//       setConnectionStatus("error");
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
//       alert("✅ Alert sent successfully!");
//     }
//   };

//   const calculateDistance = (path) => {
//     if (!path || path.length < 2) return 0;

//     let total = 0;
//     for (let i = 0; i < path.length - 1; i++) {
//       const R = 6371e3;
//       const φ1 = (path[i][0] * Math.PI) / 180;
//       const φ2 = (path[i + 1][0] * Math.PI) / 180;
//       const Δφ = ((path[i + 1][0] - path[i][0]) * Math.PI) / 180;
//       const Δλ = ((path[i + 1][1] - path[i][1]) * Math.PI) / 180;

//       const a =
//         Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//         Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//       total += R * c;
//     }
//     return total;
//   };

//   const getStatusColor = () => {
//     switch (connectionStatus) {
//       case "live":
//         return "#4caf50";
//       case "connecting":
//         return "#ff9800";
//       case "error":
//         return "#f44336";
//       default:
//         return "#9e9e9e";
//     }
//   };

//   const getStatusText = () => {
//     switch (connectionStatus) {
//       case "live":
//         return "🔴 LIVE";
//       case "connecting":
//         return "⏳ Connecting...";
//       case "error":
//         return "❌ Error";
//       default:
//         return "⚫ Offline";
//     }
//   };

//   return (
//     <div style={styles.container}>
//       {/* Modern Sidebar */}
//       <div style={styles.sidebar}>
//         <div style={styles.brandSection}>
//           <div style={styles.brandIcon}>🎓</div>
//           <div>
//             <div style={styles.brandName}>SecureStream AI</div>
//             <div style={styles.brandTagline}>Proctor Console</div>
//           </div>
//         </div>

//         <div style={styles.statsContainer}>
//           <div style={styles.miniStat}>
//             <div style={styles.miniStatIcon}>👥</div>
//             <div>
//               <div style={styles.miniStatValue}>{users.length}</div>
//               <div style={styles.miniStatLabel}>Students</div>
//             </div>
//           </div>
//           <div style={styles.miniStat}>
//             <div style={styles.miniStatIcon}>📹</div>
//             <div>
//               <div style={styles.miniStatValue}>
//                 {users.filter((u) => u.cameraActive).length}
//               </div>
//               <div style={styles.miniStatLabel}>Monitored</div>
//             </div>
//           </div>
//         </div>

//         <div style={styles.divider}></div>

//         <div style={styles.section}>
//           <div style={styles.sectionHeader}>
//             <span style={styles.sectionIcon}>🎥</span>
//             <span style={styles.sectionTitle}>Active Sessions</span>
//           </div>

//           {users.length === 0 ? (
//             <div style={styles.emptyState}>
//               <div style={styles.emptyIcon}>👻</div>
//               <div style={styles.emptyText}>No students online</div>
//             </div>
//           ) : (
//             users.map((user, idx) => (
//               <div
//                 key={idx}
//                 style={{
//                   ...styles.studentItem,
//                   background:
//                     selectedUser === user.userId
//                       ? "rgba(255,255,255,0.25)"
//                       : "rgba(255,255,255,0.1)",
//                 }}
//                 onClick={() => setSelectedUser(user.userId)}
//               >
//                 <div style={styles.studentAvatar}>
//                   <span style={styles.avatarEmoji}>👤</span>
//                   {user.cameraActive && <div style={styles.liveDot}></div>}
//                 </div>
//                 <div style={styles.studentDetails}>
//                   <div style={styles.studentName}>
//                     {user.userId.substring(0, 15)}...
//                   </div>
//                   <div style={styles.studentStatus}>
//                     {user.cameraActive ? (
//                       <span style={styles.statusActive}>● Camera Active</span>
//                     ) : (
//                       <span style={styles.statusInactive}>○ Offline</span>
//                     )}
//                   </div>
//                 </div>
//                 {userLocations[user.userId] && (
//                   <div style={styles.trackingBadge}>📍</div>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Main Content */}
//       <div style={styles.mainContent}>
//         {/* Top Bar */}
//         <div style={styles.topBar}>
//           <div>
//             <h1 style={styles.pageTitle}>Monitoring Dashboard</h1>
//             <p style={styles.pageSubtitle}>
//               Real-time exam surveillance system
//             </p>
//           </div>
//           <div style={{ ...styles.statusPill, borderColor: getStatusColor() }}>
//             <div
//               style={{ ...styles.statusDot, background: getStatusColor() }}
//             ></div>
//             <span style={styles.statusText}>{getStatusText()}</span>
//           </div>
//         </div>

//         {/* Main Grid */}
//         <div style={styles.contentGrid}>
//           {/* Video Feed */}
//           <div style={styles.card}>
//             <div style={styles.cardHeader}>
//               <div style={styles.cardTitleGroup}>
//                 <span style={styles.cardIcon}>🎥</span>
//                 <div>
//                   <h3 style={styles.cardTitle}>Live Camera Feed</h3>
//                   <p style={styles.cardSubtitle}>Student's exam environment</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setShowFullscreen(!showFullscreen)}
//                 style={styles.iconButton}
//               >
//                 {showFullscreen ? "🗙" : "⛶"}
//               </button>
//             </div>
//             <div style={styles.videoContainer}>
//               <video
//                 ref={remoteVideoRef}
//                 autoPlay
//                 playsInline
//                 style={styles.video}
//               />
//               {connectionStatus !== "live" && (
//                 <div style={styles.videoPlaceholder}>
//                   <div style={styles.placeholderPulse}>
//                     <div style={styles.placeholderIcon}>📹</div>
//                   </div>
//                   <div style={styles.placeholderText}>
//                     {connectionStatus === "connecting"
//                       ? "Establishing connection..."
//                       : "Waiting for student to join"}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Map */}
//           <div style={styles.card}>
//             <div style={styles.cardHeader}>
//               <div style={styles.cardTitleGroup}>
//                 <span style={styles.cardIcon}>🗺️</span>
//                 <div>
//                   <h3 style={styles.cardTitle}>Live Location Tracking</h3>
//                   <p style={styles.cardSubtitle}>
//                     GPS coordinates & movement trail
//                   </p>
//                 </div>
//               </div>
//               <div style={styles.mapLegend}>
//                 <span style={styles.legendItem}>
//                   <span
//                     style={{ ...styles.legendDot, background: "#f44336" }}
//                   ></span>
//                   Student Position
//                 </span>
//               </div>
//             </div>
//             <div style={styles.mapContainer}>
//               {Object.keys(userLocations).length === 0 ? (
//                 <div style={styles.mapPlaceholder}>
//                   <div style={styles.mapPlaceholderIcon}>📍</div>
//                   <div style={styles.mapPlaceholderTitle}>No Location Data</div>
//                   <div style={styles.mapPlaceholderText}>
//                     Students will appear here when they enable location
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   <MapContainer
//                     center={mapCenter}
//                     zoom={15}
//                     style={{
//                       height: "100%",
//                       width: "100%",
//                       borderRadius: "12px",
//                     }}
//                   >
//                     <TileLayer
//                       attribution="&copy; OpenStreetMap"
//                       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                     />
//                     <MapController center={mapCenter} />

//                     {Object.entries(userLocations).map(([userId, location]) => (
//                       <div key={userId}>
//                         <Marker
//                           position={[location.latitude, location.longitude]}
//                           icon={studentIcon}
//                         >
//                           <Popup>
//                             <div style={styles.popupContainer}>
//                               <div style={styles.popupHeader}>
//                                 <span style={styles.popupIcon}>👤</span>
//                                 <strong style={styles.popupTitle}>
//                                   {userId}
//                                 </strong>
//                               </div>
//                               <div style={styles.popupBody}>
//                                 <div style={styles.popupRow}>
//                                   <span style={styles.popupLabel}>
//                                     Latitude:
//                                   </span>
//                                   <span style={styles.popupValue}>
//                                     {location.latitude.toFixed(6)}
//                                   </span>
//                                 </div>
//                                 <div style={styles.popupRow}>
//                                   <span style={styles.popupLabel}>
//                                     Longitude:
//                                   </span>
//                                   <span style={styles.popupValue}>
//                                     {location.longitude.toFixed(6)}
//                                   </span>
//                                 </div>
//                                 <div style={styles.popupRow}>
//                                   <span style={styles.popupLabel}>
//                                     Accuracy:
//                                   </span>
//                                   <span style={styles.popupValue}>
//                                     {location.accuracy.toFixed(0)}m
//                                   </span>
//                                 </div>
//                                 <div style={styles.popupRow}>
//                                   <span style={styles.popupLabel}>
//                                     Updated:
//                                   </span>
//                                   <span style={styles.popupValue}>
//                                     {new Date(
//                                       location.timestamp
//                                     ).toLocaleTimeString()}
//                                   </span>
//                                 </div>
//                               </div>
//                               <a
//                                 href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 style={styles.popupButton}
//                               >
//                                 Open in Google Maps →
//                               </a>
//                             </div>
//                           </Popup>
//                         </Marker>

//                         {locationHistory[userId] &&
//                           locationHistory[userId].length > 1 && (
//                             <Polyline
//                               positions={locationHistory[userId]}
//                               pathOptions={{
//                                 color: "#f44336",
//                                 weight: 4,
//                                 opacity: 0.8,
//                                 dashArray: "10, 10",
//                               }}
//                             />
//                           )}
//                       </div>
//                     ))}
//                   </MapContainer>

//                   {/* Location Stats Overlay */}
//                   <div style={styles.mapStatsOverlay}>
//                     {Object.entries(userLocations).map(([userId, location]) => (
//                       <div key={userId} style={styles.mapStatCard}>
//                         <div style={styles.mapStatRow}>
//                           <span style={styles.mapStatLabel}>📍 Student:</span>
//                           <span style={styles.mapStatValue}>
//                             {userId.substring(0, 12)}...
//                           </span>
//                         </div>
//                         <div style={styles.mapStatRow}>
//                           <span style={styles.mapStatLabel}>🚶 Distance:</span>
//                           <span style={styles.mapStatValue}>
//                             {calculateDistance(locationHistory[userId]).toFixed(
//                               0
//                             )}
//                             m
//                           </span>
//                         </div>
//                         <div style={styles.mapStatRow}>
//                           <span style={styles.mapStatLabel}>📊 Updates:</span>
//                           <span style={styles.mapStatValue}>
//                             {locationHistory[userId]?.length || 0}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Alert Panel */}
//         <div style={styles.alertPanel}>
//           <div style={styles.alertHeader}>
//             <div style={styles.cardTitleGroup}>
//               <span style={styles.cardIcon}>📢</span>
//               <div>
//                 <h3 style={styles.cardTitle}>Send Alert to Student</h3>
//                 <p style={styles.cardSubtitle}>
//                   Real-time warning notifications
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div style={styles.alertContent}>
//             <select
//               value={selectedUser || ""}
//               onChange={(e) => setSelectedUser(e.target.value)}
//               style={styles.selectInput}
//             >
//               <option value="">Select a student...</option>
//               {users.map((user, idx) => (
//                 <option key={idx} value={user.userId}>
//                   {user.userId} {user.cameraActive ? "🟢" : "⚫"}
//                 </option>
//               ))}
//             </select>
//             <textarea
//               value={feedbackText}
//               onChange={(e) => setFeedbackText(e.target.value)}
//               placeholder="Type your warning message here... (e.g., 'Please keep your eyes on the screen')"
//               style={styles.textareaInput}
//             />
//             <button
//               onClick={sendFeedback}
//               style={styles.sendBtn}
//               disabled={!selectedUser || !feedbackText}
//             >
//               <span style={styles.btnIcon}>📤</span>
//               Send Alert
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// const styles = {
//   container: {
//     display: "flex",
//     minHeight: "100vh",
//     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//     fontFamily:
//       "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
//   },
//   sidebar: {
//     width: "300px",
//     background: "rgba(255,255,255,0.1)",
//     backdropFilter: "blur(20px)",
//     borderRight: "1px solid rgba(255,255,255,0.2)",
//     padding: "25px",
//     color: "white",
//     overflowY: "auto",
//   },
//   brandSection: {
//     display: "flex",
//     alignItems: "center",
//     gap: "15px",
//     marginBottom: "30px",
//   },
//   brandIcon: {
//     fontSize: "40px",
//     filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
//   },
//   brandName: {
//     fontSize: "20px",
//     fontWeight: "700",
//     letterSpacing: "-0.5px",
//   },
//   brandTagline: {
//     fontSize: "12px",
//     opacity: 0.8,
//     marginTop: "2px",
//   },
//   statsContainer: {
//     display: "grid",
//     gridTemplateColumns: "1fr 1fr",
//     gap: "12px",
//     marginBottom: "25px",
//   },
//   miniStat: {
//     display: "flex",
//     alignItems: "center",
//     gap: "10px",
//     background: "rgba(255,255,255,0.15)",
//     padding: "15px",
//     borderRadius: "12px",
//     backdropFilter: "blur(10px)",
//   },
//   miniStatIcon: {
//     fontSize: "24px",
//   },
//   miniStatValue: {
//     fontSize: "24px",
//     fontWeight: "700",
//     lineHeight: "1",
//   },
//   miniStatLabel: {
//     fontSize: "11px",
//     opacity: 0.9,
//     marginTop: "2px",
//   },
//   divider: {
//     height: "1px",
//     background: "rgba(255,255,255,0.2)",
//     margin: "25px 0",
//   },
//   section: {
//     marginBottom: "25px",
//   },
//   sectionHeader: {
//     display: "flex",
//     alignItems: "center",
//     gap: "10px",
//     marginBottom: "15px",
//   },
//   sectionIcon: {
//     fontSize: "18px",
//   },
//   sectionTitle: {
//     fontSize: "14px",
//     fontWeight: "600",
//     textTransform: "uppercase",
//     letterSpacing: "0.5px",
//   },
//   emptyState: {
//     textAlign: "center",
//     padding: "40px 20px",
//   },
//   emptyIcon: {
//     fontSize: "48px",
//     marginBottom: "10px",
//     opacity: 0.5,
//   },
//   emptyText: {
//     fontSize: "13px",
//     opacity: 0.7,
//   },
//   studentItem: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//     padding: "12px",
//     borderRadius: "10px",
//     marginBottom: "8px",
//     cursor: "pointer",
//     transition: "all 0.2s",
//   },
//   studentAvatar: {
//     position: "relative",
//     width: "45px",
//     height: "45px",
//     background: "rgba(255,255,255,0.2)",
//     borderRadius: "50%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     flexShrink: 0,
//   },
//   avatarEmoji: {
//     fontSize: "22px",
//   },
//   liveDot: {
//     position: "absolute",
//     top: "0",
//     right: "0",
//     width: "12px",
//     height: "12px",
//     background: "#4caf50",
//     border: "2px solid white",
//     borderRadius: "50%",
//     animation: "blink 1.5s infinite",
//   },
//   studentDetails: {
//     flex: 1,
//     minWidth: 0,
//   },
//   studentName: {
//     fontSize: "13px",
//     fontWeight: "600",
//     marginBottom: "3px",
//     overflow: "hidden",
//     textOverflow: "ellipsis",
//     whiteSpace: "nowrap",
//   },
//   studentStatus: {
//     fontSize: "11px",
//   },
//   statusActive: {
//     color: "#4caf50",
//   },
//   statusInactive: {
//     opacity: 0.6,
//   },
//   trackingBadge: {
//     fontSize: "16px",
//     opacity: 0.8,
//   },
//   mainContent: {
//     flex: 1,
//     padding: "25px",
//     overflowY: "auto",
//   },
//   topBar: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: "25px",
//     background: "rgba(255,255,255,0.95)",
//     padding: "20px 25px",
//     borderRadius: "15px",
//     boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
//   },
//   pageTitle: {
//     fontSize: "28px",
//     fontWeight: "700",
//     color: "#1a1a1a",
//     margin: 0,
//     letterSpacing: "-0.5px",
//   },
//   pageSubtitle: {
//     fontSize: "13px",
//     color: "#666",
//     margin: "5px 0 0 0",
//   },
//   statusPill: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//     padding: "10px 18px",
//     background: "white",
//     border: "2px solid",
//     borderRadius: "25px",
//   },
//   statusDot: {
//     width: "8px",
//     height: "8px",
//     borderRadius: "50%",
//     animation: "pulse 2s infinite",
//   },
//   statusText: {
//     fontSize: "13px",
//     fontWeight: "600",
//     color: "#333",
//   },
//   contentGrid: {
//     display: "grid",
//     gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
//     gap: "20px",
//     marginBottom: "20px",
//   },
//   card: {
//     background: "rgba(255,255,255,0.95)",
//     borderRadius: "15px",
//     overflow: "hidden",
//     boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
//   },
//   cardHeader: {
//     padding: "20px 25px",
//     borderBottom: "1px solid rgba(0,0,0,0.08)",
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   cardTitleGroup: {
//     display: "flex",
//     alignItems: "center",
//     gap: "12px",
//   },
//   cardIcon: {
//     fontSize: "24px",
//   },
//   cardTitle: {
//     fontSize: "16px",
//     fontWeight: "700",
//     color: "#1a1a1a",
//     margin: 0,
//   },
//   cardSubtitle: {
//     fontSize: "12px",
//     color: "#666",
//     margin: "3px 0 0 0",
//   },
//   iconButton: {
//     width: "36px",
//     height: "36px",
//     border: "none",
//     background: "rgba(0,0,0,0.05)",
//     borderRadius: "8px",
//     fontSize: "16px",
//     cursor: "pointer",
//     transition: "all 0.2s",
//   },
//   mapLegend: {
//     display: "flex",
//     gap: "15px",
//   },
//   legendItem: {
//     display: "flex",
//     alignItems: "center",
//     gap: "6px",
//     fontSize: "11px",
//     color: "#666",
//   },
//   legendDot: {
//     width: "10px",
//     height: "10px",
//     borderRadius: "50%",
//   },
//   videoContainer: {
//     position: "relative",
//     paddingTop: "56.25%",
//     background: "#000",
//   },
//   video: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     width: "100%",
//     height: "100%",
//     objectFit: "cover",
//   },
//   videoPlaceholder: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     width: "100%",
//     height: "100%",
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
//   },
//   placeholderPulse: {
//     marginBottom: "20px",
//     animation: "pulse 2s infinite",
//   },
//   placeholderIcon: {
//     fontSize: "64px",
//     opacity: 0.5,
//   },
//   placeholderText: {
//     color: "rgba(255,255,255,0.7)",
//     fontSize: "14px",
//   },
//   mapContainer: {
//     position: "relative",
//     height: "450px",
//   },
//   mapPlaceholder: {
//     height: "100%",
//     display: "flex",
//     flexDirection: "column",
//     alignItems: "center",
//     justifyContent: "center",
//     background: "linear-gradient(135deg, #f5f7fa 0%, #e8eaf0 100%)",
//   },
//   mapPlaceholderIcon: {
//     fontSize: "64px",
//     marginBottom: "15px",
//     opacity: 0.5,
//   },
//   mapPlaceholderTitle: {
//     fontSize: "18px",
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: "8px",
//   },
//   mapPlaceholderText: {
//     fontSize: "13px",
//     color: "#666",
//   },
//   mapStatsOverlay: {
//     position: "absolute",
//     top: "15px",
//     right: "15px",
//     zIndex: 1000,
//     display: "flex",
//     flexDirection: "column",
//     gap: "10px",
//     maxWidth: "250px",
//   },
//   mapStatCard: {
//     background: "rgba(255,255,255,0.95)",
//     backdropFilter: "blur(10px)",
//     padding: "12px 15px",
//     borderRadius: "10px",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
//   },
//   mapStatRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginBottom: "6px",
//   },
//   mapStatLabel: {
//     fontSize: "11px",
//     color: "#666",
//   },
//   mapStatValue: {
//     fontSize: "12px",
//     fontWeight: "600",
//     color: "#1a1a1a",
//   },
//   popupContainer: {
//     minWidth: "200px",
//   },
//   popupHeader: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//     marginBottom: "12px",
//     paddingBottom: "8px",
//     borderBottom: "1px solid #e0e0e0",
//   },
//   popupIcon: {
//     fontSize: "18px",
//   },
//   popupTitle: {
//     fontSize: "14px",
//     color: "#333",
//   },
//   popupBody: {
//     marginBottom: "12px",
//   },
//   popupRow: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginBottom: "6px",
//   },
//   popupLabel: {
//     fontSize: "11px",
//     color: "#666",
//   },
//   popupValue: {
//     fontSize: "11px",
//     fontWeight: "600",
//     color: "#333",
//   },
//   popupButton: {
//     display: "block",
//     width: "100%",
//     padding: "8px",
//     background: "#667eea",
//     color: "white",
//     textAlign: "center",
//     textDecoration: "none",
//     borderRadius: "6px",
//     fontSize: "11px",
//     fontWeight: "600",
//   },
//   alertPanel: {
//     background: "rgba(255,255,255,0.95)",
//     borderRadius: "15px",
//     overflow: "hidden",
//     boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
//   },
//   alertHeader: {
//     padding: "20px 25px",
//     borderBottom: "1px solid rgba(0,0,0,0.08)",
//   },
//   alertContent: {
//     padding: "25px",
//   },
//   selectInput: {
//     width: "100%",
//     padding: "14px 16px",
//     border: "2px solid #e0e0e0",
//     borderRadius: "10px",
//     fontSize: "14px",
//     marginBottom: "15px",
//     transition: "all 0.2s",
//     background: "white",
//   },
//   textareaInput: {
//     width: "100%",
//     minHeight: "100px",
//     padding: "14px 16px",
//     border: "2px solid #e0e0e0",
//     borderRadius: "10px",
//     fontSize: "14px",
//     fontFamily: "inherit",
//     resize: "vertical",
//     marginBottom: "15px",
//     transition: "all 0.2s",
//   },
//   sendBtn: {
//     width: "100%",
//     padding: "14px 20px",
//     background: "linear-gradient(135deg, #f44336 0%, #e91e63 100%)",
//     color: "white",
//     border: "none",
//     borderRadius: "10px",
//     fontSize: "15px",
//     fontWeight: "600",
//     cursor: "pointer",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "8px",
//     transition: "all 0.3s",
//     boxShadow: "0 4px 15px rgba(244, 67, 54, 0.3)",
//   },
//   btnIcon: {
//     fontSize: "18px",
//   },
// };

// // Add keyframe animations
// const styleSheet = document.createElement("style");
// styleSheet.textContent = `
//   @keyframes pulse {
//     0%, 100% { opacity: 1; transform: scale(1); }
//     50% { opacity: 0.7; transform: scale(1.05); }
//   }
//   @keyframes blink {
//     0%, 100% { opacity: 1; }
//     50% { opacity: 0.3; }
//   }
// `;
// document.head.appendChild(styleSheet);

// export default AdminDashboard;
