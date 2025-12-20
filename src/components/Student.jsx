////////////////////////////////////////////////////////////////////////
/////
// this code is not touched now so just use this for feature back of face detection working properly only updat after we have to go to on student route

import { useEffect, useState, useRef } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

function StudentDashboard() {
  const [feedback, setFeedback] = useState("");
  const [showExamStart, setShowExamStart] = useState(true);
  const [showExam, setShowExam] = useState(false);

  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const streamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const locationWatchIdRef = useRef(null);
  const userIdRef = useRef(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    const userId =
      sessionStorage.getItem("userId") ||
      `student_${Math.random().toString(36).substr(2, 9)}`;
    userIdRef.current = userId;

    socket.on("connect", () => {
      console.log("✅ STUDENT: Socket connected!", socket.id);
    });

    socket.emit("register-user", userId);

    socket.on("receive-feedback", (message) => {
      console.log("📢 STUDENT: Received feedback:", message);
      setFeedback(message);
      setTimeout(() => setFeedback(""), 5000);
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

  const startEverything = async () => {
    try {
      console.log("🎥 Requesting camera...");

      // 🔥 HIGHER QUALITY FOR BETTER DETECTION
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      console.log("✅ Camera granted!", stream);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            console.log("✅ Video playing!");
          } catch (err) {
            console.error("Play error:", err);
          }
        };
      }

      socket.emit("camera-permission-granted");
      await createPeerConnection(stream);
      startLocationTracking();

      // 🔥 WAIT FOR VIDEO TO STABILIZE
      setTimeout(() => {
        initFaceDetection();
      }, 3000);
    } catch (error) {
      console.error("❌ Camera error:", error);
      alert("Please allow camera access!");
    }
  };

  const handleStartExam = () => {
    setShowExamStart(false);
    setShowExam(true);

    if (!streamRef.current) {
      setTimeout(() => startEverything(), 100);
    }
  };

  const initFaceDetection = async () => {
    try {
      console.log("👁️ Initializing face detection...");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      // 🔥 USE FULL RANGE MODEL (BETTER ACCURACY)
      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.5, // 🔥 BALANCED
      });

      console.log("✅ Face detector ready!");

      let lastEmitTime = 0;
      const EMIT_INTERVAL = 500; // Emit every 500ms

      let detectionBuffer = [];
      const BUFFER_SIZE = 10; // 🔥 Track last 10 detections

      const detectFaces = () => {
        if (detectorRef.current && videoRef.current?.readyState === 4) {
          try {
            const now = Date.now();

            const results = detectorRef.current.detectForVideo(
              videoRef.current,
              now
            );

            const hasDetection =
              results.detections && results.detections.length > 0;

            let currentConfidence = 0;
            if (hasDetection) {
              const rawConfidence =
                results.detections[0]?.categories[0]?.score || 0;
              currentConfidence = Math.round(rawConfidence * 100);
            }

            // 🔥 ADD TO BUFFER
            detectionBuffer.push({
              detected: hasDetection && currentConfidence >= 40,
              confidence: currentConfidence,
            });

            if (detectionBuffer.length > BUFFER_SIZE) {
              detectionBuffer.shift();
            }

            // 🔥 EMIT EVERY 500ms WITH SMOOTHED DATA
            if (
              now - lastEmitTime >= EMIT_INTERVAL &&
              detectionBuffer.length >= 5
            ) {
              lastEmitTime = now;

              const detectedCount = detectionBuffer.filter(
                (d) => d.detected
              ).length;
              const avgConfidence =
                detectionBuffer
                  .filter((d) => d.confidence > 0)
                  .reduce((sum, d) => sum + d.confidence, 0) /
                Math.max(
                  1,
                  detectionBuffer.filter((d) => d.confidence > 0).length
                );

              // 🔥 FACE IS PRESENT IF 60% OF BUFFER HAS FACE
              const hasFace = detectedCount >= BUFFER_SIZE * 0.6;

              // 🔥 BOOST CONFIDENCE IF CONSISTENTLY DETECTED
              let finalConfidence = Math.round(avgConfidence);
              if (hasFace && detectedCount >= BUFFER_SIZE * 0.8) {
                finalConfidence = Math.min(95, finalConfidence + 10); // Boost by 10%
              }

              const status = {
                hasFace: hasFace,
                confidence: hasFace ? finalConfidence : 0,
                timestamp: now,
                userId: userIdRef.current,
                studentId: userIdRef.current,
                detectionRate: `${detectedCount}/${BUFFER_SIZE}`, // Debug info
              };

              socket.emit("face-status", status);
              console.log("📤 EMITTING:", status);
            }
          } catch (error) {
            console.error("Detection error:", error);
          }
        }
        requestAnimationFrame(detectFaces);
      };

      detectFaces();
    } catch (error) {
      console.error("❌ Face detection error:", error);
    }
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;

    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        socket.emit("location-update", {
          userId: userIdRef.current,
          location: location,
        });
      },
      (error) => console.error("❌ Location error:", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const createPeerConnection = async (stream) => {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
    peerConnectionRef.current = new RTCPeerConnection(configuration);

    stream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, stream);
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: "admin",
        });
      }
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", { offer, to: "admin" });
  };

  const handleAnswer = async ({ answer }) => {
    try {
      if (!peerConnectionRef.current) return;
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
      for (const candidate of pendingCandidatesRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
    } catch (error) {
      console.error("❌ Error handling answer:", error);
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
      } else {
        pendingCandidatesRef.current.push(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("❌ Error adding ICE candidate:", error);
    }
  };

  return (
    <div style={styles.container}>
      {showExamStart && (
        <div style={styles.startContainer}>
          <div style={styles.startCard}>
            <div style={styles.monitorBadge}>
              <span style={styles.monitorDot}>●</span>
              <span style={styles.monitorText}>✓ Monitored</span>
            </div>

            <div style={styles.startIcon}>📝</div>
            <h1 style={styles.startTitle}>Data Structures Final Exam</h1>
            <p style={styles.startSubtitle}>
              You are now authenticated and ready to begin
            </p>

            <div style={styles.detailsBox}>
              <div style={styles.detail}>
                <span style={styles.detailIcon}>📋</span>
                <div>
                  <div style={styles.detailLabel}>Total Questions</div>
                  <div style={styles.detailValue}>50</div>
                </div>
              </div>
              <div style={styles.detail}>
                <span style={styles.detailIcon}>⏱️</span>
                <div>
                  <div style={styles.detailLabel}>Duration</div>
                  <div style={styles.detailValue}>2 Hours</div>
                </div>
              </div>
              <div style={styles.detail}>
                <span style={styles.detailIcon}>📊</span>
                <div>
                  <div style={styles.detailLabel}>Total Marks</div>
                  <div style={styles.detailValue}>100</div>
                </div>
              </div>
            </div>

            <button onClick={handleStartExam} style={styles.startButton}>
              <span style={styles.startButtonIcon}>🚀</span>
              Start Exam
            </button>
          </div>
        </div>
      )}

      {showExam && (
        <div style={styles.examLayout}>
          {/* 🔥 LEFT SIDE: CAMERA */}
          <div style={styles.cameraSection}>
            <div style={styles.cameraCard}>
              <div style={styles.cameraHeader}>
                <span style={styles.cameraIcon}>📹</span>
                <h3 style={styles.cameraTitle}>Live Monitoring</h3>
                <span style={styles.liveIndicator}>🔴 LIVE</span>
              </div>

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={styles.video}
              />

              <div style={styles.cameraFooter}>
                <span style={styles.userId}>
                  {userIdRef.current?.substring(0, 15)}...
                </span>
              </div>
            </div>
          </div>

          {/* 🔥 RIGHT SIDE: QUESTIONS */}
          <div style={styles.questionsSection}>
            <div style={styles.examHeader}>
              <h2 style={styles.examTitle}>📝 Data Structures Final Exam</h2>
              <div style={styles.examInfo}>
                <span style={styles.examTime}>⏱️ Time: 1:45:23</span>
                <span style={styles.examStatus}>🟢 Active</span>
              </div>
            </div>

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

            {feedback && (
              <div style={styles.feedback}>
                <strong>⚠️ Proctor Alert:</strong> {feedback}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  startContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  startCard: {
    background: "white",
    borderRadius: "20px",
    padding: "50px 40px",
    maxWidth: "700px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    position: "relative",
    textAlign: "center",
  },
  monitorBadge: {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: "#d4edda",
    padding: "8px 16px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "2px solid #4caf50",
  },
  monitorDot: { color: "#4caf50", fontSize: "12px" },
  monitorText: { fontSize: "13px", fontWeight: "600", color: "#155724" },
  startIcon: { fontSize: "80px", marginBottom: "20px" },
  startTitle: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: "0 0 10px 0",
  },
  startSubtitle: { fontSize: "15px", color: "#666", marginBottom: "40px" },
  detailsBox: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "20px",
    marginBottom: "30px",
  },
  detail: {
    background: "#f8f9fa",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  detailIcon: { fontSize: "32px" },
  detailLabel: { fontSize: "12px", color: "#666", marginBottom: "5px" },
  detailValue: { fontSize: "18px", fontWeight: "700", color: "#333" },
  startButton: {
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(76, 175, 80, 0.4)",
  },
  startButtonIcon: { fontSize: "24px" },

  examLayout: {
    display: "grid",
    gridTemplateColumns: "350px 1fr",
    height: "100vh",
    gap: "20px",
    padding: "20px",
  },

  cameraSection: {
    display: "flex",
    flexDirection: "column",
  },
  cameraCard: {
    background: "white",
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
  cameraHeader: {
    padding: "15px 20px",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraIcon: { fontSize: "20px" },
  cameraTitle: {
    fontSize: "14px",
    fontWeight: "700",
    margin: 0,
    flex: 1,
    marginLeft: "10px",
  },
  liveIndicator: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#f44336",
  },

  video: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
    background: "#000",
    display: "block",
  },

  cameraFooter: {
    padding: "12px 20px",
    background: "#f8f9fa",
    borderTop: "1px solid #e0e0e0",
  },
  userId: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "600",
  },

  questionsSection: {
    background: "white",
    borderRadius: "15px",
    padding: "25px",
    overflowY: "auto",
    boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
  },
  examHeader: {
    marginBottom: "25px",
    paddingBottom: "20px",
    borderBottom: "2px solid #e0e0e0",
  },
  examTitle: { fontSize: "24px", color: "#333", margin: "0 0 15px 0" },
  examInfo: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  },
  examTime: { color: "#666" },
  examStatus: { color: "#4caf50", fontWeight: "600" },
  questionCard: { marginBottom: "30px" },
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
  radio: { marginRight: "12px" },
  optionText: { fontSize: "15px", color: "#333" },
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

export default StudentDashboard;
