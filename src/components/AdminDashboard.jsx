// import { useEffect, useState, useRef } from "react";
// import io from "socket.io-client";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   Polyline,
//   useMapEvents,
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
// const studentIcon = L.divIcon({
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
//     ">
//       📍
//     </div>
//   `,
//   iconSize: [40, 40],
//   iconAnchor: [20, 40],
//   popupAnchor: [0, -40],
// });

// // Auto-update map view component
// function LocationMarkers({ locations, history }) {
//   const map = useMapEvents({});

//   useEffect(() => {
//     if (Object.keys(locations).length > 0) {
//       const firstLocation = Object.values(locations)[0];
//       map.setView([firstLocation.latitude, firstLocation.longitude], 15);
//     }
//   }, [locations, map]);

//   return (
//     <>
//       {Object.entries(locations).map(([userId, location]) => (
//         <div key={userId}>
//           <Marker
//             position={[location.latitude, location.longitude]}
//             icon={studentIcon}
//           >
//             <Popup>
//               <div style={popupStyles.container}>
//                 <div style={popupStyles.header}>
//                   <span style={popupStyles.icon}>👤</span>
//                   <strong style={popupStyles.title}>{userId}</strong>
//                 </div>
//                 <div style={popupStyles.body}>
//                   <div style={popupStyles.row}>
//                     <span style={popupStyles.label}>Latitude:</span>
//                     <span style={popupStyles.value}>
//                       {location.latitude.toFixed(6)}
//                     </span>
//                   </div>
//                   <div style={popupStyles.row}>
//                     <span style={popupStyles.label}>Longitude:</span>
//                     <span style={popupStyles.value}>
//                       {location.longitude.toFixed(6)}
//                     </span>
//                   </div>
//                   <div style={popupStyles.row}>
//                     <span style={popupStyles.label}>Accuracy:</span>
//                     <span style={popupStyles.value}>
//                       {location.accuracy.toFixed(0)}m
//                     </span>
//                   </div>
//                   <div style={popupStyles.row}>
//                     <span style={popupStyles.label}>Updated:</span>
//                     <span style={popupStyles.value}>
//                       {new Date(location.timestamp).toLocaleTimeString()}
//                     </span>
//                   </div>
//                 </div>
//                 <a
//                   href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   style={popupStyles.button}
//                 >
//                   Open in Google Maps →
//                 </a>
//               </div>
//             </Popup>
//           </Marker>

//           {history[userId] && history[userId].length > 1 && (
//             <Polyline
//               positions={history[userId]}
//               pathOptions={{
//                 color: "#f44336",
//                 weight: 4,
//                 opacity: 0.8,
//                 dashArray: "10, 5",
//               }}
//             />
//           )}
//         </div>
//       ))}
//     </>
//   );
// }

// const popupStyles = {
//   container: { minWidth: "200px" },
//   header: {
//     display: "flex",
//     alignItems: "center",
//     gap: "8px",
//     marginBottom: "12px",
//     paddingBottom: "8px",
//     borderBottom: "1px solid #e0e0e0",
//   },
//   icon: { fontSize: "18px" },
//   title: { fontSize: "14px", color: "#333" },
//   body: { marginBottom: "12px" },
//   row: {
//     display: "flex",
//     justifyContent: "space-between",
//     marginBottom: "6px",
//   },
//   label: { fontSize: "11px", color: "#666" },
//   value: { fontSize: "11px", fontWeight: "600", color: "#333" },
//   button: {
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
// };

// function AdminDashboard() {
//   const [users, setUsers] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [feedbackText, setFeedbackText] = useState("");
//   const [connectionStatus, setConnectionStatus] = useState("Disconnected");
//   const [userLocations, setUserLocations] = useState({});
//   const [locationHistory, setLocationHistory] = useState({});
//   const [mapKey, setMapKey] = useState(0); // Force map re-render
//   const remoteVideoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const pendingCandidatesRef = useRef([]);

//   useEffect(() => {
//     socket.emit("register-admin");

//     socket.on("users-updated", (usersList) => {
//       console.log("Users updated:", usersList);
//       setUsers(usersList.filter((u) => u.type === "user"));
//     });

//     socket.on("offer", handleOffer);
//     socket.on("ice-candidate", handleIceCandidate);

//     socket.on("user-location-update", ({ userId, location }) => {
//       console.log("📍 Location update received:", userId, location);

//       setUserLocations((prev) => {
//         const updated = {
//           ...prev,
//           [userId]: location,
//         };
//         console.log("Updated locations:", updated);
//         return updated;
//       });

//       setLocationHistory((prev) => {
//         const newHistory = {
//           ...prev,
//           [userId]: [
//             ...(prev[userId] || []),
//             [location.latitude, location.longitude],
//           ],
//         };
//         console.log("Updated history:", newHistory);
//         return newHistory;
//       });

//       // Force map re-render
//       setMapKey((prevKey) => prevKey + 1);
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

//   console.log("Current locations:", userLocations);
//   console.log("Current history:", locationHistory);

//   return (
//     <div style={styles.container}>
//       {/* Sidebar - keeping your beautiful sidebar unchanged */}
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

//           {/* Map - FIXED VERSION */}
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
//                   Live Position
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
//                     key={mapKey} // Force re-render on location update
//                     center={[
//                       Object.values(userLocations)[0].latitude,
//                       Object.values(userLocations)[0].longitude,
//                     ]}
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
//                     <LocationMarkers
//                       locations={userLocations}
//                       history={locationHistory}
//                     />
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
//                         <div style={styles.mapStatRow}>
//                           <span style={styles.mapStatLabel}>
//                             🕐 Last Update:
//                           </span>
//                           <span style={styles.mapStatValue}>
//                             {new Date(location.timestamp).toLocaleTimeString()}
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
//               placeholder="Type your warning message here..."
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

// // All your existing styles remain the same
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
//     opacity: "0.7",
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

// export default AdminDashboard;

import React, { useEffect, useState, useRef } from "react";
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

// ----------------------------------------------------------------------
// 1. LEAFLET CONFIGURATION
// ----------------------------------------------------------------------

// Fix default marker icon issues in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom student marker (red pin)
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

// ----------------------------------------------------------------------
// 2. MAP HELPER COMPONENTS
// ----------------------------------------------------------------------

// Only recenter map when the selected user changes
function MapRecenter({ selectedUser, userLocations }) {
  const map = useMap();
  useEffect(() => {
    if (selectedUser && userLocations[selectedUser]) {
      const { latitude, longitude } = userLocations[selectedUser];
      map.setView([latitude, longitude], 16, { animate: true });
    }
  }, [selectedUser, userLocations, map]);
  return null;
}

// Render markers and trails from props
function MapLayers({ userLocations, locationHistory }) {
  return (
    <>
      {Object.entries(userLocations).map(([userId, location]) => (
        <React.Fragment key={userId}>
          <Marker
            position={[location.latitude, location.longitude]}
            icon={studentIcon}
          >
            <Popup>
              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                <strong style={{ color: "#d32f2f" }}>👤 {userId}</strong>
                <br />
                📍 Lat: {location.latitude.toFixed(6)}
                <br />
                📍 Lng: {location.longitude.toFixed(6)}
                <br />
                🎯 Accuracy: {location.accuracy.toFixed(0)}m<br />
                🕒 {new Date(location.timestamp).toLocaleTimeString()}
              </div>
            </Popup>
          </Marker>

          {locationHistory[userId] && locationHistory[userId].length > 1 && (
            <Polyline
              positions={locationHistory[userId]}
              pathOptions={{ color: "#d32f2f", weight: 4, opacity: 0.7 }}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
}

// ----------------------------------------------------------------------
// 3. MAIN COMPONENT
// ----------------------------------------------------------------------

const socket = io("http://localhost:3001");

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [userLocations, setUserLocations] = useState({});
  const [locationHistory, setLocationHistory] = useState({});
  const [showFullscreen, setShowFullscreen] = useState(false);

  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  useEffect(() => {
    socket.emit("register-admin");

    // -- Socket Listeners --

    socket.on("users-updated", (list) => {
      setUsers(list.filter((u) => u.type === "user"));
    });

    socket.on("offer", handleOffer);
    socket.on("ice-candidate", handleIceCandidate);

    socket.on("user-location-update", ({ userId, location }) => {
      // 1. Update current location
      setUserLocations((prev) => ({
        ...prev,
        [userId]: location,
      }));

      // 2. Append to history for trail
      setLocationHistory((prev) => ({
        ...prev,
        [userId]: [
          ...(prev[userId] || []),
          [location.latitude, location.longitude],
        ],
      }));
    });

    return () => {
      socket.off();
    };
  }, []);

  // -- WebRTC Logic --

  const handleOffer = async ({ offer, from }) => {
    try {
      setConnectionStatus("connecting");
      console.log("📥 Offer received from:", from);

      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      peerConnectionRef.current = new RTCPeerConnection(config);

      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current
            .play()
            .catch((e) => console.error("Play error:", e));
          setConnectionStatus("live");
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            candidate: event.candidate,
            to: from,
          });
        }
      };

      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current.connectionState;
        console.log("🔗 Connection State:", state);
        if (state === "connected") setConnectionStatus("live");
        if (state === "failed" || state === "disconnected")
          setConnectionStatus("error");
      };

      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Add queued candidates
      for (const candidate of pendingCandidatesRef.current) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit("answer", { answer, to: from });
    } catch (err) {
      console.error("❌ Error handling offer:", err);
      setConnectionStatus("error");
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
    } catch (err) {
      console.error("❌ Error adding ICE candidate:", err);
    }
  };

  // -- Helper Functions --

  const sendFeedback = () => {
    if (selectedUser && feedbackText) {
      socket.emit("send-feedback", {
        userId: selectedUser,
        message: feedbackText,
      });
      setFeedbackText("");
      alert("✅ Alert sent successfully!");
    }
  };

  const calculateDistance = (path) => {
    if (!path || path.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const lat1 = path[i][0];
      const lon1 = path[i][1];
      const lat2 = path[i + 1][0];
      const lon2 = path[i + 1][1];

      const R = 6371e3; // meters
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

  // -- Render Helpers --

  const getStatusColor = () => {
    if (connectionStatus === "live") return "#4caf50";
    if (connectionStatus === "connecting") return "#ff9800";
    if (connectionStatus === "error") return "#f44336";
    return "#9e9e9e";
  };

  // Check if map should display (we need at least one user location)
  const hasLocationData = Object.keys(userLocations).length > 0;

  // Default center if no data
  const defaultCenter = [28.6139, 77.209]; // New Delhi default
  const mapCenter = hasLocationData
    ? [
        Object.values(userLocations)[0].latitude,
        Object.values(userLocations)[0].longitude,
      ]
    : defaultCenter;

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
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
            <span style={styles.sectionIcon}>🎥</span>
            <span style={styles.sectionTitle}>Active Sessions</span>
          </div>

          {users.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👻</div>
              <div style={styles.emptyText}>No students online</div>
            </div>
          ) : (
            users.map((user, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.studentItem,
                  background:
                    selectedUser === user.userId
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(255,255,255,0.1)",
                }}
                onClick={() => setSelectedUser(user.userId)}
              >
                <div style={styles.studentAvatar}>
                  <span style={styles.avatarEmoji}>👤</span>
                  {user.cameraActive && <div style={styles.liveDot}></div>}
                </div>
                <div style={styles.studentDetails}>
                  <div style={styles.studentName}>
                    {user.userId.substring(0, 15)}...
                  </div>
                  <div style={styles.studentStatus}>
                    {user.cameraActive ? (
                      <span style={styles.statusActive}>● Camera Active</span>
                    ) : (
                      <span style={styles.statusInactive}>○ Offline</span>
                    )}
                  </div>
                </div>
                {userLocations[user.userId] && (
                  <div style={styles.trackingBadge}>📍</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainContent}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Monitoring Dashboard</h1>
            <p style={styles.pageSubtitle}>
              Real-time exam surveillance system
            </p>
          </div>
          <div style={{ ...styles.statusPill, borderColor: getStatusColor() }}>
            <div
              style={{ ...styles.statusDot, background: getStatusColor() }}
            ></div>
            <span style={styles.statusText}>
              {connectionStatus === "live" ? "LIVE" : connectionStatus}
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div style={styles.contentGrid}>
          {/* VIDEO FEED */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitleGroup}>
                <span style={styles.cardIcon}>🎥</span>
                <div>
                  <h3 style={styles.cardTitle}>Live Camera Feed</h3>
                  <p style={styles.cardSubtitle}>Student's exam environment</p>
                </div>
              </div>
              <button
                onClick={() => setShowFullscreen(!showFullscreen)}
                style={styles.iconButton}
                title="Toggle Fullscreen"
              >
                ⛶
              </button>
            </div>
            <div style={styles.videoContainer}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={styles.video}
              />
              {connectionStatus !== "live" && (
                <div style={styles.videoPlaceholder}>
                  <div style={styles.placeholderPulse}>
                    <div style={styles.placeholderIcon}>📹</div>
                  </div>
                  <div style={styles.placeholderText}>
                    {connectionStatus === "connecting"
                      ? "Establishing connection..."
                      : "Waiting for student to join"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MAP TRACKING */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitleGroup}>
                <span style={styles.cardIcon}>🗺️</span>
                <div>
                  <h3 style={styles.cardTitle}>Live Location Tracking</h3>
                  <p style={styles.cardSubtitle}>
                    GPS coordinates & movement trail
                  </p>
                </div>
              </div>
              <div style={styles.mapLegend}>
                <span style={styles.legendItem}>
                  <span
                    style={{ ...styles.legendDot, background: "#d32f2f" }}
                  ></span>
                  Live Position
                </span>
              </div>
            </div>

            <div style={styles.mapContainer}>
              {!hasLocationData ? (
                <div style={styles.mapPlaceholder}>
                  <div style={styles.mapPlaceholderIcon}>📍</div>
                  <div style={styles.mapPlaceholderTitle}>No Location Data</div>
                  <div style={styles.mapPlaceholderText}>
                    Students will appear here when they enable location
                  </div>
                </div>
              ) : (
                <>
                  <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{
                      height: "100%",
                      width: "100%",
                      borderRadius: "12px",
                    }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapRecenter
                      selectedUser={selectedUser}
                      userLocations={userLocations}
                    />
                    <MapLayers
                      userLocations={userLocations}
                      locationHistory={locationHistory}
                    />
                  </MapContainer>

                  {/* Stats Overlay on Map */}
                  <div style={styles.mapStatsOverlay}>
                    {Object.entries(userLocations).map(([userId, location]) => (
                      <div key={userId} style={styles.mapStatCard}>
                        <div style={styles.mapStatRow}>
                          <span style={styles.mapStatLabel}>📍 Student:</span>
                          <span style={styles.mapStatValue}>
                            {userId.substring(0, 12)}...
                          </span>
                        </div>
                        <div style={styles.mapStatRow}>
                          <span style={styles.mapStatLabel}>🚶 Distance:</span>
                          <span style={styles.mapStatValue}>
                            {calculateDistance(locationHistory[userId]).toFixed(
                              0
                            )}
                            m
                          </span>
                        </div>
                        <div style={styles.mapStatRow}>
                          <span style={styles.mapStatLabel}>📊 Updates:</span>
                          <span style={styles.mapStatValue}>
                            {locationHistory[userId]?.length || 0}
                          </span>
                        </div>
                        <div style={styles.mapStatRow}>
                          <span style={styles.mapStatLabel}>
                            🕐 Last Update:
                          </span>
                          <span style={styles.mapStatValue}>
                            {new Date(location.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ALERT PANEL */}
        <div style={styles.alertPanel}>
          <div style={styles.alertHeader}>
            <div style={styles.cardTitleGroup}>
              <span style={styles.cardIcon}>📢</span>
              <div>
                <h3 style={styles.cardTitle}>Send Alert to Student</h3>
                <p style={styles.cardSubtitle}>
                  Real-time warning notifications
                </p>
              </div>
            </div>
          </div>
          <div style={styles.alertContent}>
            <select
              value={selectedUser || ""}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={styles.selectInput}
            >
              <option value="">Select a student...</option>
              {users.map((user, idx) => (
                <option key={idx} value={user.userId}>
                  {user.userId} {user.cameraActive ? "🟢" : "⚫"}
                </option>
              ))}
            </select>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type warning message (e.g. 'Please focus on the screen')..."
              style={styles.textareaInput}
            />
            <button
              onClick={sendFeedback}
              style={styles.sendBtn}
              disabled={!selectedUser || !feedbackText}
            >
              <span style={styles.btnIcon}>📤</span>
              Send Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 4. STYLES (Glassmorphism & Layout)
// ----------------------------------------------------------------------

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#333",
  },
  sidebar: {
    width: "300px",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    borderRight: "1px solid rgba(255,255,255,0.2)",
    padding: "25px",
    color: "white",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  brandSection: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "30px",
  },
  brandIcon: {
    fontSize: "40px",
    filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
  },
  brandName: {
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  brandTagline: {
    fontSize: "12px",
    opacity: 0.8,
    marginTop: "2px",
  },
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
    padding: "15px",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
  },
  miniStatIcon: { fontSize: "24px" },
  miniStatValue: { fontSize: "24px", fontWeight: "700", lineHeight: "1" },
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
    fontSize: "14px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  emptyState: { textAlign: "center", padding: "40px 20px" },
  emptyIcon: { fontSize: "48px", marginBottom: "10px", opacity: 0.5 },
  emptyText: { fontSize: "13px", opacity: 0.7 },
  studentItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  studentAvatar: {
    position: "relative",
    width: "45px",
    height: "45px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: "22px" },
  liveDot: {
    position: "absolute",
    top: "0",
    right: "0",
    width: "12px",
    height: "12px",
    background: "#4caf50",
    border: "2px solid white",
    borderRadius: "50%",
  },
  studentDetails: { flex: 1, minWidth: 0 },
  studentName: {
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "3px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  studentStatus: { fontSize: "11px" },
  statusActive: { color: "#4caf50" },
  statusInactive: { opacity: 0.6 },
  trackingBadge: { fontSize: "16px", opacity: 0.8 },
  mainContent: {
    flex: 1,
    padding: "25px",
    overflowY: "auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    background: "rgba(255,255,255,0.95)",
    padding: "20px 25px",
    borderRadius: "15px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  pageSubtitle: { fontSize: "13px", color: "#666", margin: "5px 0 0 0" },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "white",
    border: "2px solid",
    borderRadius: "25px",
  },
  statusDot: { width: "8px", height: "8px", borderRadius: "50%" },
  statusText: { fontSize: "13px", fontWeight: "600", color: "#333" },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    padding: "20px 25px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitleGroup: { display: "flex", alignItems: "center", gap: "12px" },
  cardIcon: { fontSize: "24px" },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1a1a1a",
    margin: 0,
  },
  cardSubtitle: { fontSize: "12px", color: "#666", margin: "3px 0 0 0" },
  iconButton: {
    width: "36px",
    height: "36px",
    border: "none",
    background: "rgba(0,0,0,0.05)",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  mapLegend: { display: "flex", gap: "15px" },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#666",
  },
  legendDot: { width: "10px", height: "10px", borderRadius: "50%" },
  videoContainer: {
    position: "relative",
    paddingTop: "56.25%",
    background: "#000",
  },
  video: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
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
  placeholderPulse: { marginBottom: "20px" },
  placeholderIcon: { fontSize: "64px", opacity: 0.5 },
  placeholderText: { color: "rgba(255,255,255,0.7)", fontSize: "14px" },
  mapContainer: { position: "relative", height: "450px" },
  mapPlaceholder: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #e8eaf0 100%)",
  },
  mapPlaceholderIcon: {
    fontSize: "64px",
    marginBottom: "15px",
    opacity: 0.5,
  },
  mapPlaceholderTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "8px",
  },
  mapPlaceholderText: { fontSize: "13px", color: "#666" },
  mapStatsOverlay: {
    position: "absolute",
    top: "15px",
    right: "15px",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "250px",
    pointerEvents: "none", // click through to map
  },
  mapStatCard: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(10px)",
    padding: "12px 15px",
    borderRadius: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    pointerEvents: "auto",
  },
  mapStatRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  mapStatLabel: { fontSize: "11px", color: "#666" },
  mapStatValue: { fontSize: "12px", fontWeight: "600", color: "#1a1a1a" },
  alertPanel: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
  },
  alertHeader: {
    padding: "20px 25px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },
  alertContent: { padding: "25px" },
  selectInput: {
    width: "100%",
    padding: "14px 16px",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    fontSize: "14px",
    marginBottom: "15px",
    background: "white",
  },
  textareaInput: {
    width: "100%",
    minHeight: "100px",
    padding: "14px 16px",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    marginBottom: "15px",
  },
  sendBtn: {
    width: "100%",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #f44336 0%, #e91e63 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 4px 15px rgba(244, 67, 54, 0.3)",
  },
  btnIcon: { fontSize: "18px" },
};

export default AdminDashboard;
