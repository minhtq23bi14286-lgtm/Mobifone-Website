import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";
import { Socket } from "socket.io-client";

const METERED_API_KEY = "1c1fac6e0fa6ef59b6cbb0fe1a9297ecf24d";
const METERED_API_URL = `https://mobifone-website.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;

interface VideoCallProps {
  socket: Socket;
  currentUser: { id: number; displayName: string };
  contact: { id: number; displayName: string };
  onClose: () => void;
  isIncoming?: boolean;
  incomingSignal?: any;
}

export default function VideoCall({
  socket,
  contact,
  onClose,
  isIncoming = false,
  incomingSignal,
}: VideoCallProps) {
  const [callStatus, setCallStatus] = useState<"calling" | "connected" | "ended">("calling");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef        = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Buffer ICE candidates nhận được trước khi remote desc được set
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSet  = useRef(false);

  const fetchIceServers = async (): Promise<RTCIceServer[]> => {
    try {
      const res = await fetch(METERED_API_URL);
      if (res.ok) {
        const servers = await res.json();
        console.log("✅ Loaded Metered TURN servers:", servers.length);
        return servers;
      }
    } catch (err) {
      console.warn("⚠️ TURN fetch failed, using STUN fallback:", err);
    }
    return [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
  };

  // Helper: set remote desc rồi flush pending candidates
  const setRemoteDescAndFlush = async (pc: RTCPeerConnection, signal: any) => {
    await pc.setRemoteDescription(new RTCSessionDescription(signal));
    remoteDescSet.current = true;
    for (const c of pendingCandidates.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    pendingCandidates.current = [];
  };

  useEffect(() => {
    fetchIceServers().then(startCall);

    socket.on("callAccepted", async ({ signal }: { signal: any }) => {
      const pc = peerRef.current;
      if (!pc) return;
      await setRemoteDescAndFlush(pc, signal);
      setCallStatus("connected");
    });

    socket.on("iceCandidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!candidate) return;
      const pc = peerRef.current;
      if (!pc) return;
      if (remoteDescSet.current) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      } else {
        // Buffer lại để flush sau khi set remote desc
        pendingCandidates.current.push(candidate);
      }
    });

    socket.on("callRejected", () => { setCallStatus("ended"); setTimeout(onClose, 1500); });
    socket.on("callEnded",    () => { setCallStatus("ended"); setTimeout(onClose, 1500); });

    return () => {
      socket.off("callAccepted");
      socket.off("iceCandidate");
      socket.off("callRejected");
      socket.off("callEnded");
      cleanup();
    };
  }, []);

  const startCall = async (servers: RTCIceServer[]) => {
    try {
      // Lấy local stream
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        console.warn("Camera unavailable, audio only");
        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      const pc = new RTCPeerConnection({
        iceServers: servers,
        iceTransportPolicy: "all",
      });
      peerRef.current = pc;

      // Thêm tracks
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Nhận remote stream
      pc.ontrack = (event) => {
        console.log("📺 ontrack fired", event.streams);
        const remoteStream = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(e => console.warn("play() failed:", e));
        }
        setCallStatus("connected");
      };

      // Gửi ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", {
            receiverId: contact.id,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
          setCallStatus("connected");
        } else if (pc.iceConnectionState === "failed") {
          console.warn("ICE failed — restarting ICE");
          pc.restartIce();
        } else if (pc.iceConnectionState === "disconnected") {
          setCallStatus("ended");
          setTimeout(onClose, 2000);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") setCallStatus("connected");
        if (pc.connectionState === "failed")    { setCallStatus("ended"); setTimeout(onClose, 1500); }
      };

      if (isIncoming && incomingSignal) {
        // Bên nhận: set offer → answer
        await setRemoteDescAndFlush(pc, incomingSignal);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answerCall", { callerId: contact.id, signal: answer });
        setCallStatus("connected");
      } else {
        // Bên gọi: tạo offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        socket.emit("callUser", { receiverId: contact.id, signal: offer });
      }
    } catch (err) {
      console.error("Lỗi khởi tạo cuộc gọi:", err);
      setCallStatus("ended");
      setTimeout(onClose, 2000);
    }
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;
    remoteDescSet.current = false;
    pendingCandidates.current = [];
  };

  const endCall = () => {
    socket.emit("endCall", { receiverId: contact.id });
    cleanup();
    onClose();
  };

  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(v => !v);
  };

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(v => !v);
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screen.getVideoTracks()[0];
        const sender = peerRef.current?.getSenders().find(s => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) { localVideoRef.current.srcObject = screen; }
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) {
            sender?.replaceTrack(camTrack);
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          }
        };
        setIsScreenSharing(true);
      } catch (err) { console.error("Screen share error:", err); }
    } else {
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        const sender = peerRef.current?.getSenders().find(s => s.track?.kind === "video");
        sender?.replaceTrack(camTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setIsScreenSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden">

        {/* Remote video — luôn render, ẩn khi chưa connected */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-500 ${callStatus === "connected" ? "opacity-100" : "opacity-0"}`}
        />

        {/* Waiting overlay */}
        {callStatus !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center mb-4 animate-pulse shadow-2xl">
              <span className="text-white text-4xl font-bold">{contact.displayName.charAt(0)}</span>
            </div>
            <p className="text-white text-2xl font-semibold">{contact.displayName}</p>
            <p className="text-gray-400 mt-2 animate-pulse">
              {callStatus === "calling"
                ? (isIncoming ? "Đang kết nối..." : "Đang gọi...")
                : "Cuộc gọi đã kết thúc"}
            </p>
          </div>
        )}

        {/* Local PiP */}
        <div className="absolute bottom-4 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Contact name */}
        <div className="absolute top-4 left-4">
          <p className="text-white font-semibold text-lg drop-shadow">{contact.displayName}</p>
          {callStatus === "connected" && <p className="text-green-400 text-sm">● Đang kết nối</p>}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/80 px-8 py-6 flex items-center justify-center gap-6">
        <button onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}>
          {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        <button onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg">
          <PhoneOff className="w-7 h-7 text-white" />
        </button>

        <button onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? "bg-red-500" : "bg-white/20 hover:bg-white/30"}`}>
          {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
        </button>

        <button onClick={toggleScreenShare}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isScreenSharing ? "bg-blue-500" : "bg-white/20 hover:bg-white/30"}`}>
          <Monitor className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}