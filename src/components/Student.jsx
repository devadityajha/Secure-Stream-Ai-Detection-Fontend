// file: src/StudentDashboard.jsx
import { useEffect, useState, useRef } from "react";
// 1. Remove Face-api imports, they are now in Context
// import { useProctoring } from "./ProctoringContext"; // <--- Import the Hook
import { useProctoring } from "../context/ProctoringContext";

function StudentDashboard() {
  const { stream, startMonitoring, faceStatus, userId } = useProctoring();
  const [showExamStart, setShowExamStart] = useState(true);
  const [showExam, setShowExam] = useState(false);

  // 2. Get stream and logic from Context

  const videoRef = useRef(null);

  // 3. When the student clicks "Start Exam"
  const handleStartExam = () => {
    setShowExamStart(false);
    setShowExam(true);
    startMonitoring(); // Tell Context to turn on the camera
  };

  // 4. Attach the stream to the <video> tag whenever it becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showExam]); // Run when stream changes or exam view opens

  return (
    <div style={styles.container}>
      {showExamStart && (
        <div style={styles.startContainer}>
          {/* ... keeping your existing start screen UI ... */}
          <div style={styles.startCard}>
            <h1 style={styles.startTitle}>Data Structures Final Exam</h1>
            <button onClick={handleStartExam} style={styles.startButton}>
              🚀 Start Exam
            </button>
          </div>
        </div>
      )}

      {showExam && (
        <div style={styles.examLayout}>
          {/* LEFT SIDE: CAMERA */}
          <div style={styles.cameraSection}>
            <div style={styles.cameraCard}>
              <div style={styles.cameraHeader}>
                <h3 style={styles.cameraTitle}>Live Monitoring</h3>
                {/* 5. Use faceStatus from Context for UI feedback */}
                <span
                  style={{
                    ...styles.liveIndicator,
                    color: faceStatus.hasFace ? "green" : "red",
                  }}
                >
                  {faceStatus.hasFace ? "🟢 DETECTED" : "🔴 NO FACE"}
                </span>
              </div>

              {/* The Video Element just plays the stream from Context */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={styles.video}
              />

              <div style={styles.cameraFooter}>
                <span style={styles.userId}>{userId}</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: QUESTIONS (Unchanged) */}
          <div style={styles.questionsSection}>
            <div style={styles.examHeader}>
              <h2 style={styles.examTitle}>📝 Data Structures Final Exam</h2>
            </div>
            {/* ... Rest of your question UI ... */}
            <div style={styles.questionCard}>
              <h3 style={styles.questionTitle}>Question 1</h3>
              <p>This is the exam content...</p>
            </div>
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
