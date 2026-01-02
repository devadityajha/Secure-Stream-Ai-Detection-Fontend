// import React, { useEffect, useRef, useState } from "react";
// import { useProctoring } from "../context/ProctoringContext";

// function StudentDashboard() {
//   const { stream, startMonitoring, faceStatus, userId } = useProctoring();
//   const [examStarted, setExamStarted] = useState(false);
//   const videoRef = useRef(null);

//   useEffect(() => {
//     if (videoRef.current && stream) videoRef.current.srcObject = stream;
//   }, [stream]);

//   if (!examStarted) {
//     return (
//       <div style={stuStyles.setupBg}>
//         <div style={stuStyles.setupCard}>
//           <div style={{ fontSize: "50px" }}>📝</div>
//           <h2 style={{ margin: "20px 0 10px" }}>Ready to begin?</h2>
//           <p style={{ color: "#64748b", marginBottom: "30px" }}>
//             Student ID: {userId}
//           </p>
//           <button
//             style={stuStyles.btnPrimary}
//             onClick={() => {
//               setExamStarted(true);
//               startMonitoring();
//             }}
//           >
//             Enter Exam Hall
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div style={stuStyles.examLayout}>
//       {/* Proctoring Sidebar */}
//       <aside style={stuStyles.proctorSidebar}>
//         <div style={stuStyles.videoBox}>
//           <video
//             ref={videoRef}
//             autoPlay
//             muted
//             playsInline
//             style={stuStyles.selfVideo}
//           />
//           <div
//             style={{
//               ...stuStyles.statusOverlay,
//               color: faceStatus.hasFace ? "#4ade80" : "#f87171",
//             }}
//           >
//             {faceStatus.hasFace ? "● LIVE: Monitoring" : "● WARNING: NO FACE"}
//           </div>
//         </div>
//         <div style={stuStyles.infoCard}>
//           <h4>Exam Security</h4>
//           <ul style={stuStyles.list}>
//             <li>
//               Face tracking: <strong>Active</strong>
//             </li>
//             <li>
//               Tab lock: <strong>Enabled</strong>
//             </li>
//             <li>
//               Location: <strong>Logged</strong>
//             </li>
//           </ul>
//         </div>
//       </aside>

//       {/* Exam Content */}
//       <main style={stuStyles.examMain}>
//         <header style={stuStyles.examHeader}>
//           <h3>Advanced Data Structures - Midterm</h3>
//           <div style={stuStyles.timer}>Time Left: 44:12</div>
//         </header>
//         <div style={stuStyles.questionCard}>
//           <span style={{ color: "#6366f1", fontWeight: "700" }}>
//             Question 01
//           </span>
//           <p style={{ fontSize: "18px", margin: "15px 0" }}>
//             What is the average time complexity of searching in a Hash Map?
//           </p>
//           {["O(1)", "O(log n)", "O(n)", "O(n^2)"].map((opt) => (
//             <label key={opt} style={stuStyles.option}>
//               <input type="radio" name="q1" /> {opt}
//             </label>
//           ))}
//         </div>
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "flex-end",
//             marginTop: "20px",
//           }}
//         >
//           <button style={stuStyles.btnPrimary}>Save & Next</button>
//         </div>
//       </main>
//     </div>
//   );
// }

// const stuStyles = {
//   setupBg: {
//     height: "100vh",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     background: "#f8fafc",
//   },
//   setupCard: {
//     background: "white",
//     padding: "50px",
//     borderRadius: "24px",
//     textAlign: "center",
//     boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
//   },
//   btnPrimary: {
//     background: "#6366f1",
//     color: "white",
//     border: "none",
//     padding: "14px 32px",
//     borderRadius: "12px",
//     fontWeight: "600",
//     cursor: "pointer",
//   },
//   examLayout: {
//     display: "grid",
//     gridTemplateColumns: "300px 1fr",
//     height: "100vh",
//     background: "#f1f5f9",
//   },
//   proctorSidebar: {
//     padding: "20px",
//     background: "white",
//     borderRight: "1px solid #e2e8f0",
//   },
//   videoBox: {
//     position: "relative",
//     borderRadius: "12px",
//     overflow: "hidden",
//     background: "#000",
//     height: "200px",
//     marginBottom: "20px",
//   },
//   selfVideo: { width: "100%", height: "100%", objectFit: "cover" },
//   statusOverlay: {
//     position: "absolute",
//     bottom: "10px",
//     left: "10px",
//     fontSize: "11px",
//     fontWeight: "700",
//     textShadow: "0 1px 2px rgba(0,0,0,0.5)",
//   },
//   infoCard: { background: "#f8fafc", padding: "16px", borderRadius: "12px" },
//   list: {
//     paddingLeft: "18px",
//     fontSize: "13px",
//     color: "#475569",
//     lineHeight: "2",
//   },
//   examMain: { padding: "40px", overflowY: "auto" },
//   examHeader: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: "30px",
//   },
//   timer: {
//     background: "#fee2e2",
//     color: "#991b1b",
//     padding: "8px 16px",
//     borderRadius: "8px",
//     fontWeight: "700",
//   },
//   questionCard: {
//     background: "white",
//     padding: "30px",
//     borderRadius: "16px",
//     boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
//   },
//   option: {
//     display: "block",
//     padding: "15px",
//     border: "1px solid #e2e8f0",
//     borderRadius: "10px",
//     marginBottom: "10px",
//     cursor: "pointer",
//   },
// };

// export default StudentDashboard;

import React, { useEffect, useRef, useState } from "react";
import { useProctoring } from "../context/ProctoringContext";

function StudentDashboard() {
  const { stream, startMonitoring, faceStatus, userId } = useProctoring();
  const [examStarted, setExamStarted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  if (!examStarted) {
    return (
      <div style={stuStyles.setupBg}>
        <div style={stuStyles.setupCard}>
          <div style={stuStyles.setupIcon}>🔐</div>
          <h2 style={stuStyles.setupTitle}>Secure Authentication</h2>
          <p style={stuStyles.setupSubtitle}>
            Verifying environment for ID: <strong>{userId}</strong>
          </p>
          <div style={stuStyles.setupDivider} />
          <ul style={stuStyles.setupChecks}>
            <li>✓ Camera check</li>
            <li>✓ Identity verification</li>
            <li>✓ Environment lockdown</li>
          </ul>
          <button
            style={stuStyles.btnStart}
            onClick={() => {
              setExamStarted(true);
              startMonitoring();
            }}
          >
            Enter Secure Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={stuStyles.examLayout}>
      <aside style={stuStyles.proctorSidebar}>
        <div style={stuStyles.brandSmall}>🛡️ SECURESTREAM</div>
        <div style={stuStyles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={stuStyles.selfVideo}
          />
          <div
            style={{
              ...stuStyles.statusBadge,
              backgroundColor: faceStatus.hasFace
                ? "rgba(16, 185, 129, 0.9)"
                : "rgba(239, 68, 68, 0.9)",
            }}
          >
            {faceStatus.hasFace ? "● SECURED" : "● WARNING: FACE LOST"}
          </div>
        </div>

        <div style={stuStyles.monitoringCard}>
          <div style={stuStyles.monitorHeader}>AI Proctoring Logs</div>
          <div style={stuStyles.logItem}>
            <span>Visual Track</span>{" "}
            <span>{faceStatus.hasFace ? "Steady" : "Lost"}</span>
          </div>
          <div style={stuStyles.logItem}>
            <span>Identity</span> <span>Verified</span>
          </div>
          <div style={stuStyles.logItem}>
            <span>Audio</span> <span>Isolated</span>
          </div>
        </div>

        <div style={stuStyles.candidateCard}>
          <div style={stuStyles.candidateLabel}>CANDIDATE ID</div>
          <div style={stuStyles.candidateValue}>{userId.slice(0, 18)}</div>
        </div>
      </aside>

      <main style={stuStyles.examMain}>
        <header style={stuStyles.examHeader}>
          <div>
            <div style={stuStyles.subject}>MIDTERM EXAMINATION 2026</div>
            <h2 style={stuStyles.examTitle}>
              Advanced Data Structures & Algorithms
            </h2>
          </div>
          <div style={stuStyles.timerBox}>
            <span style={stuStyles.timerLabel}>EST. TIME REMAINING</span>
            <span style={stuStyles.timerValue}>00:44:12</span>
          </div>
        </header>

        <div style={stuStyles.questionWrapper}>
          <div style={stuStyles.qHeader}>
            <span style={stuStyles.qCount}>SECTION A • QUESTION 01</span>
            <span style={stuStyles.points}>4 POINTS</span>
          </div>
          <p style={stuStyles.qText}>
            Analyze the average time complexity of searching within a Balanced
            Binary Search Tree (BST) with N nodes.
          </p>

          <div style={stuStyles.optionsGrid}>
            {["O(1)", "O(log n)", "O(n)", "O(n log n)"].map((opt) => (
              <label key={opt} style={stuStyles.optionCard}>
                <input type="radio" name="examQ" style={stuStyles.radio} />
                <span style={stuStyles.optionText}>{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={stuStyles.actionRow}>
          <button style={stuStyles.btnSkip}>Mark for Review</button>
          <button style={stuStyles.btnNext}>Save & Continue</button>
        </div>
      </main>
    </div>
  );
}

const stuStyles = {
  setupBg: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
  },
  setupCard: {
    background: "white",
    padding: "60px",
    borderRadius: "32px",
    textAlign: "center",
    width: "450px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
  },
  setupIcon: { fontSize: "60px", marginBottom: "20px" },
  setupTitle: { fontSize: "24px", fontWeight: "800", color: "#1e293b" },
  setupSubtitle: { color: "#64748b", margin: "10px 0 30px", fontSize: "14px" },
  setupDivider: { height: "1px", background: "#f1f5f9", margin: "24px 0" },
  setupChecks: {
    listStyle: "none",
    padding: 0,
    textAlign: "left",
    display: "inline-block",
    color: "#475569",
    fontWeight: "600",
    fontSize: "13px",
    marginBottom: "40px",
  },
  btnStart: {
    width: "100%",
    background: "#6366f1",
    color: "white",
    border: "none",
    padding: "18px",
    borderRadius: "16px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 15px -3px rgba(99,102,241,0.3)",
  },
  examLayout: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    height: "100vh",
    background: "#f8fafc",
  },
  proctorSidebar: {
    padding: "30px",
    background: "white",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  brandSmall: {
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "2px",
    color: "#6366f1",
  },
  videoContainer: {
    position: "relative",
    borderRadius: "20px",
    overflow: "hidden",
    background: "#000",
    height: "220px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
  },
  selfVideo: { width: "100%", height: "100%", objectFit: "cover" },
  statusBadge: {
    position: "absolute",
    top: "15px",
    left: "15px",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "10px",
    fontWeight: "900",
    color: "white",
  },
  monitoringCard: {
    background: "#f1f5f9",
    padding: "20px",
    borderRadius: "16px",
  },
  monitorHeader: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#475569",
    marginBottom: "12px",
    letterSpacing: "1px",
  },
  logItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    padding: "8px 0",
    borderBottom: "1px solid #e2e8f0",
    fontWeight: "600",
    color: "#64748b",
  },
  candidateCard: {
    marginTop: "auto",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "20px",
  },
  candidateLabel: { fontSize: "10px", fontWeight: "800", color: "#94a3b8" },
  candidateValue: { fontSize: "13px", fontWeight: "700", color: "#1e293b" },
  examMain: { padding: "50px 80px", overflowY: "auto" },
  examHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "60px",
  },
  subject: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#6366f1",
    letterSpacing: "1.5px",
  },
  examTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1e293b",
    marginTop: "8px",
  },
  timerBox: {
    textAlign: "right",
    background: "white",
    padding: "12px 24px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  },
  timerLabel: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#94a3b8",
    display: "block",
  },
  timerValue: { fontSize: "20px", fontWeight: "800", color: "#ef4444" },
  questionWrapper: {
    background: "white",
    padding: "50px",
    borderRadius: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
    border: "1px solid #f1f5f9",
  },
  qHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  qCount: { fontSize: "11px", fontWeight: "800", color: "#6366f1" },
  points: { fontSize: "11px", fontWeight: "800", color: "#94a3b8" },
  qText: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#334155",
    lineHeight: "1.5",
    marginBottom: "40px",
  },
  optionsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  optionCard: {
    padding: "20px",
    border: "2px solid #f1f5f9",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  radio: { width: "18px", height: "18px" },
  optionText: { fontSize: "15px", fontWeight: "600", color: "#475569" },
  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "40px",
  },
  btnSkip: {
    padding: "16px 30px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "white",
    fontWeight: "700",
    color: "#64748b",
    cursor: "pointer",
  },
  btnNext: {
    padding: "16px 40px",
    borderRadius: "12px",
    border: "none",
    background: "#1e293b",
    fontWeight: "700",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 10px 15px -3px rgba(30,41,59,0.3)",
  },
};

export default StudentDashboard;
