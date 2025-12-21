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
    // DON'T REGISTER ON MOUNT!

    socket.on("answer", async ({ answer }) => {
      console.log("📨 STUDENT: Answer received");

      if (!peerConnectionRef.current) {
        console.error("❌ STUDENT: No peer connection!");
        return;
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log("✅ STUDENT: Remote description set");

        for (const candidate of pendingCandidatesRef.current) {
          await peerConnectionRef.current.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];
        console.log("✅ STUDENT: WebRTC complete");
      } catch (error) {
        console.error("❌ STUDENT: Error:", error);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      const iceCandidate = new RTCIceCandidate(candidate);

      if (peerConnectionRef.current?.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(iceCandidate);
          console.log("✅ STUDENT: ICE added");
        } catch (error) {
          console.error("❌ STUDENT: ICE error:", error);
        }
      } else {
        pendingCandidatesRef.current.push(iceCandidate);
      }
    });

    return () => {
      stopMonitoring();
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  const initWebRTC = async (currentStream) => {
    console.log("🎥 STUDENT: Initializing WebRTC");

    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    currentStream.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, currentStream);
      console.log("✅ STUDENT: Track added:", track.kind);
    });

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: "admin",
          from: userIdRef.current,
        });
      }
    };

    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log(
        "🔌 STUDENT: State:",
        peerConnectionRef.current.connectionState
      );
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    console.log("📤 STUDENT: Sending offer");
    socket.emit("offer", { offer, to: "admin", from: userIdRef.current });
  };

  const startMonitoring = async () => {
    try {
      // 🔥 REGISTER ONLY WHEN "START EXAM" IS CLICKED
      if (!hasRegistered.current) {
        console.log("🆕 STUDENT: Registering with ID:", userIdRef.current);
        socket.emit("register-user", userIdRef.current);
        hasRegistered.current = true;
      }

      console.log("📹 STUDENT: Starting...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      console.log("✅ STUDENT: Camera granted");
      socket.emit("camera-permission-granted");

      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();

      await initWebRTC(mediaStream);
      await initAI();
    } catch (err) {
      console.error("❌ STUDENT: Failed:", err);
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
      console.log("✅ STUDENT: AI ready");
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
