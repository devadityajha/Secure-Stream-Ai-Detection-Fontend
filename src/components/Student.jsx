import { useEffect, useState, useRef } from "react";
import { useProctoring } from "../context/ProctoringContext";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

const sampleQuestions = [
  {
    id: 1,
    text: "What is the time complexity of binary search in a sorted array?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
  },
  {
    id: 2,
    text: "Which data structure uses FIFO (First In First Out)?",
    options: ["Stack", "Queue", "Tree", "Graph"],
  },
  {
    id: 3,
    text: "Which traversal of a BST gives sorted order?",
    options: ["Preorder", "Inorder", "Postorder", "Level order"],
  },
];

function StudentDashboard() {
  const { stream, startMonitoring, faceStatus, userId } = useProctoring();
  const [showExamStart, setShowExamStart] = useState(true);
  const [showExam, setShowExam] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const videoRef = useRef(null);

  // REFS FOR TRACKING
  const tabSwitchCountRef = useRef(0);
  const windowSwitchCountRef = useRef(0);
  const ssCountRef = useRef(0); // Tracking Screenshots

  const [canTrack, setCanTrack] = useState(false);

  useEffect(() => {
    if (!userId || !showExam) return;

    // 1. GRACE PERIOD: Prevents starting at '1' due to permission popups
    const gracePeriodTimeout = setTimeout(() => {
      setCanTrack(true);
      console.log("✅ Monitoring ACTIVE");
    }, 3000);

    let blurTimeout = null;

    // 2. SCREENSHOT HANDLER: Only triggers for Keyboard Shortcuts
    const handleScreenshotEvent = () => {
      if (!canTrack) return;
      ssCountRef.current++;
      console.log("📸 Keyboard Screenshot Detected!");
      socket.emit("screenshot-taken", {
        userId: userId,
        count: ssCountRef.current,
      });
    };

    const handleKeyDown = (e) => {
      if (!canTrack) return;
      // Detect PrintScreen (Win) and Cmd+Shift shortcuts (Mac)
      if (
        e.key === "PrintScreen" ||
        e.keyCode === 44 ||
        (e.metaKey && e.shiftKey) ||
        (e.ctrlKey && e.key === "p")
      ) {
        handleScreenshotEvent();
      }
    };

    // 3. WINDOW SWITCH HANDLER: Only triggers when focus is lost
    const handleWindowBlur = () => {
      if (!canTrack) return;

      blurTimeout = setTimeout(() => {
        // If the tab is still visible, it's a Window Switch (clicked outside)
        if (!document.hidden) {
          windowSwitchCountRef.current++;
          console.log("🚫 WINDOW SWITCH detected");
          socket.emit("window-switch", {
            userId: userId,
            count: windowSwitchCountRef.current,
          });
        }
      }, 150);
    };

    // 4. TAB SWITCH HANDLER: Only triggers when tab is hidden
    const handleVisibilityChange = () => {
      if (!canTrack) return;

      if (document.hidden) {
        if (blurTimeout) clearTimeout(blurTimeout);
        tabSwitchCountRef.current++;
        console.log("⚠️ TAB SWITCH detected");
        socket.emit("tab-switch", {
          userId: userId,
          count: tabSwitchCountRef.current,
        });
      }
    };

    const handleWindowFocus = () => {
      if (blurTimeout) clearTimeout(blurTimeout);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(gracePeriodTimeout);
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, [userId, showExam, canTrack]);

  const handleStartExam = () => {
    setShowExamStart(false);
    setShowExam(true);
    startMonitoring();
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showExam]);

  const currentQuestion = sampleQuestions[currentIndex];

  const handleOptionChange = (qid, option) => {
    setAnswers((prev) => ({ ...prev, [qid]: option }));
  };

  const gotoPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const gotoNext = () =>
    setCurrentIndex((i) => Math.min(sampleQuestions.length - 1, i + 1));

  return (
    <div style={styles.container}>
      {showExamStart && (
        <div style={styles.startContainer}>
          <div style={styles.startCard}>
            <div style={styles.monitorBadge}>
              <span style={styles.monitorDot}>●</span>
              <span style={styles.monitorText}>Monitored</span>
            </div>
            <div style={styles.startIcon}>📘</div>
            <h1 style={styles.startTitle}>Data Structures Final Exam</h1>
            <p style={styles.startSubtitle}>
              Authentication successful. Please stay focused.
            </p>
            <div style={styles.detailsBox}>
              <div style={styles.detail}>
                <div>
                  <div style={styles.detailLabel}>Questions</div>
                  <div style={styles.detailValue}>3</div>
                </div>
              </div>
              <div style={styles.detail}>
                <div>
                  <div style={styles.detailLabel}>Duration</div>
                  <div style={styles.detailValue}>30 min</div>
                </div>
              </div>
              <div style={styles.detail}>
                <div>
                  <div style={styles.detailLabel}>Marks</div>
                  <div style={styles.detailValue}>30</div>
                </div>
              </div>
            </div>
            <button onClick={handleStartExam} style={styles.startButton}>
              🚀 Start Exam
            </button>
          </div>
        </div>
      )}

      {showExam && (
        <div style={styles.examLayout}>
          <section style={styles.cameraSection}>
            <div style={styles.cameraCard}>
              <div style={styles.cameraHeader}>
                <h3 style={styles.cameraTitle}>Live Feed</h3>
                <span
                  style={{
                    ...styles.liveIndicator,
                    color: faceStatus.hasFace ? "#4caf50" : "#f44336",
                  }}
                >
                  {faceStatus.hasFace ? "🟢 DETECTED" : "🔴 NO FACE"}
                </span>
              </div>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={styles.video}
              />
              <div style={styles.cameraFooter}>
                <span style={styles.userIdLabel}>ID: {userId}</span>
              </div>
            </div>
            <div style={styles.tipsCard}>
              <h4 style={styles.tipsTitle}>Rules</h4>
              <ul style={styles.tipsList}>
                <li>No Tab Switching</li>
                <li>No Window Switching</li>
                <li>No Screenshotting (PrintScreen/Shortcuts)</li>
              </ul>
            </div>
          </section>

          <section style={styles.questionsSection}>
            <div style={styles.examHeader}>
              <h2 style={styles.examTitle}>📝 DSA Exam</h2>
            </div>
            <div style={styles.questionCard}>
              <h3 style={styles.questionTitle}>{currentQuestion.text}</h3>
              <div style={styles.optionsContainer}>
                {currentQuestion.options.map((opt, idx) => (
                  <label key={idx} style={styles.optionLabel}>
                    <input
                      type="radio"
                      checked={answers[currentQuestion.id] === opt}
                      onChange={() =>
                        handleOptionChange(currentQuestion.id, opt)
                      }
                      style={styles.radio}
                    />
                    <span style={styles.optionText}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={styles.navigationButtons}>
              <button
                onClick={gotoPrev}
                disabled={currentIndex === 0}
                style={styles.prevButton}
              >
                Previous
              </button>
              <button
                onClick={gotoNext}
                disabled={currentIndex === sampleQuestions.length - 1}
                style={styles.nextButton}
              >
                Next
              </button>
            </div>
          </section>
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
  examLayout: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    minHeight: "100vh",
    gap: "20px",
    padding: "20px",
  },
  cameraSection: { display: "flex", flexDirection: "column", gap: 16 },
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
  cameraTitle: { fontSize: "14px", fontWeight: "700", margin: 0 },
  liveIndicator: { fontSize: "12px", fontWeight: "600" },
  video: {
    width: "100%",
    height: "260px",
    objectFit: "cover",
    background: "#000",
    display: "block",
  },
  cameraFooter: {
    padding: "10px 20px",
    background: "#f8f9fa",
    borderTop: "1px solid #e0e0e0",
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
  },
  userIdLabel: { color: "#777" },
  tipsCard: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: 15,
    padding: 16,
    boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
  },
  tipsTitle: { margin: "0 0 8px 0", fontSize: 14, fontWeight: 700 },
  tipsList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    color: "#555",
    lineHeight: 1.6,
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
    paddingBottom: "15px",
    borderBottom: "2px solid #e0e0e0",
  },
  examTitle: { fontSize: "24px", color: "#333", margin: "0 0 12px 0" },
  questionCard: { marginBottom: "24px" },
  questionTitle: { fontSize: "18px", color: "#333", marginBottom: "16px" },
  optionsContainer: { display: "flex", flexDirection: "column", gap: "10px" },
  optionLabel: {
    display: "flex",
    alignItems: "center",
    padding: "12px 14px",
    background: "#f8f9fa",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  radio: { marginRight: "10px" },
  optionText: { fontSize: "15px", color: "#333" },
  navigationButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "20px",
  },
  prevButton: {
    padding: "10px 26px",
    background: "#e0e0e0",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
  },
  nextButton: {
    padding: "10px 26px",
    background: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

export default StudentDashboard;
