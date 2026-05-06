import { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";
import { Socket } from "socket.io-client";

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

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  useEffect(() => {
    startCall();

    socket.on("callAccepted", async ({ signal }: { signal: any }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(signal)
        );
        setCallStatus("connected");
      }
    });

    socket.on("iceCandidate", async ({ candidate }: { candidate: any }) => {
      if (peerConnectionRef.current && candidate) {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    socket.on("callRejected", () => {
      setCallStatus("ended");
      setTimeout(onClose, 1500);
    });

    socket.on("callEnded", () => {
      setCallStatus("ended");
      setTimeout(onClose, 1500);
    });

    return () => {
      socket.off("callAccepted");
      socket.off("iceCandidate");
      socket.off("callRejected");
      socket.off("callEnded");
      endCall();
    };
  }, []);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      }).catch(() => {
        // Nếu không có camera thì thử audio only
        return navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setCallStatus("connected");
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", {
            receiverId: contact.id,
            candidate: event.candidate,
          });
        }
      };

      if (isIncoming) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answerCall", {
          callerId: contact.id,
          signal: answer,
        });
        setCallStatus("connected");
      } else {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("callUser", {
          receiverId: contact.id,
          signal: offer,
        });
      }
    } catch (err) {
      console.error("Lỗi camera/mic:", err);
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    socket.emit("endCall", { receiverId: contact.id });
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find(s => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Lỗi chia sẻ màn hình:", err);
      }
    } else {
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find(s => s.track?.kind === "video");
        sender?.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setIsScreenSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative">
        {callStatus === "connected" ? (
          <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#1F4E79] flex items-center justify-center mb-4">
              <span className="text-white text-4xl font-bold">
                {contact.displayName.charAt(0)}
              </span>
            </div>
            <p className="text-white text-2xl font-semibold">{contact.displayName}</p>
            <p className="text-gray-400 mt-2 animate-pulse">
              {callStatus === "calling"
                ? isIncoming ? "Đang kết nối..." : "Đang gọi..."
                : "Cuộc gọi đã kết thúc"}
            </p>
          </div>
        )}

        <div className="absolute bottom-4 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
          <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
        </div>

        <div className="absolute top-4 left-4">
          <p className="text-white font-semibold text-lg">{contact.displayName}</p>
          {callStatus === "connected" && (
            <p className="text-green-400 text-sm">Đang kết nối</p>
          )}
        </div>
      </div>

      <div className="bg-black/80 px-8 py-6 flex items-center justify-center gap-6">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-red-500" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isVideoOff ? "bg-red-500" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isScreenSharing ? "bg-blue-500" : "bg-white/20 hover:bg-white/30"
          }`}
        >
          <Monitor className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}