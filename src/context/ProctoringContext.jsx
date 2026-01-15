import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import io from "socket.io-client";

export const ProctoringContext = createContext(null);
const socket = io("http://localhost:3001");

export const ProctoringProvider = ({ children }) => {
  const [stream, setStream] = useState(null);
  const [faceStatus, setFaceStatus] = useState({
    hasFace: false,
    confidence: 0,
  });

  const videoRef = useRef(document.createElement("video"));
  const detectorRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const hasRegistered = useRef(false);
  const userIdRef = useRef(
    `student_${Math.random().toString(36).substr(2, 9)}`
  );

  useEffect(() => {
    socket.on("answer", async ({ answer }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        pendingCandidatesRef.current.forEach((c) =>
          peerConnectionRef.current.addIceCandidate(c)
        );
        pendingCandidatesRef.current = [];
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      const iceCandidate = new RTCIceCandidate(candidate);
      if (peerConnectionRef.current?.remoteDescription) {
        await peerConnectionRef.current.addIceCandidate(iceCandidate);
      } else {
        pendingCandidatesRef.current.push(iceCandidate);
      }
    });

    return () => {
      stopMonitoring();
      socket.off();
    };
  }, []);

  const initWebRTC = async (camStream, screenStream) => {
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add Camera Tracks
    camStream
      .getTracks()
      .forEach((track) => peerConnectionRef.current.addTrack(track, camStream));
    // Add Screen Tracks
    screenStream
      .getTracks()
      .forEach((track) =>
        peerConnectionRef.current.addTrack(track, screenStream)
      );

    peerConnectionRef.current.onicecandidate = (e) => {
      if (e.candidate)
        socket.emit("ice-candidate", {
          candidate: e.candidate,
          to: "admin",
          from: userIdRef.current,
        });
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit("offer", { offer, to: "admin", from: userIdRef.current });
  };

  const startMonitoring = async () => {
    try {
      if (!hasRegistered.current) {
        socket.emit("register-user", userIdRef.current);
        hasRegistered.current = true;
      }

      // 1. Get Camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      // 2. Get Screen Share
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();

      await initWebRTC(mediaStream, screenStream);
      await initAI();
    } catch (err) {
      console.error("Setup failed:", err);
      alert(
        "Both Camera and Screen Share permissions are required to start the exam."
      );
    }
  };

  const initAI = async () => {
    if (!detectorRef.current) {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
      });
    }
    setInterval(runDetection, 500);
  };

  const runDetection = () => {
    if (detectorRef.current && videoRef.current.readyState === 4) {
      const results = detectorRef.current.detectForVideo(
        videoRef.current,
        Date.now()
      );
      const hasFace = results.detections.length > 0;
      const confidence = hasFace
        ? Math.round(results.detections[0].categories[0].score * 100)
        : 0;
      const status = { userId: userIdRef.current, hasFace, confidence };
      setFaceStatus(status);
      socket.emit("face-status", status);
    }
  };

  const stopMonitoring = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    setStream(null);
  };

  return (
    <ProctoringContext.Provider
      value={{ stream, startMonitoring, faceStatus, userId: userIdRef.current }}
    >
      {children}
    </ProctoringContext.Provider>
  );
};

export const useProctoring = () => useContext(ProctoringContext);
