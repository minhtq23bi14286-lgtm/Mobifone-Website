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
  socket, contact, onClose, isIncoming = false, incomingSignal,
}: VideoCallProps) {
  const [callStatus, setCallStatus] = useState<"calling" | "connected" | "ended">("calling");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef        = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Incoming ICE candidates buffered until remote description is set
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSet     = useRef(false);

  // ⭐ KEY FIX: Outgoing ICE candidates buffered until peer is READY to receive them.
  // - Receiver (isIncoming): caller's VideoCall is already mounted → send immediately.
  // - Caller: receiver's VideoCall only mounts AFTER they press Accept.
  //   If we emit candidates before that, they are LOST (no listener on receiver side).
  //   So the caller queues candidates and flushes them when "callAccepted" arrives.
  const peerReady          = useRef(isIncoming);
  const outgoingCandidates = useRef<RTCIceCandidateInit[]>([]);

  const callEnded = useRef(false);

  // ── ICE Servers: Metered TURN + Google STUN ──
  const fetchIceServers = async (): Promise<RTCIceServer[]> => {
    const fallbackServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ];
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(METERED_API_URL, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const servers = await res.json();
        console.log(`[TURN] Loaded ${servers.length} Metered servers`);
        return [...servers, ...fallbackServers];
      }
    } catch (err) {
      console.warn("[TURN] Fetch failed, using STUN only:", err);
    }
    return fallbackServers;
  };

  const sendCandidate = (candidate: RTCIceCandidateInit) => {
    socket.emit("iceCandidate", { receiverId: contact.id, candidate });
  };

  const flushOutgoingCandidates = () => {
    if (outgoingCandidates.current.length > 0) {
      console.log(`[ICE] Flushing ${outgoingCandidates.current.length} buffered outgoing candidates`);
      outgoingCandidates.current.forEach(sendCandidate);
      outgoingCandidates.current = [];
    }
  };

  const setRemoteDescAndFlush = async (pc: RTCPeerConnection, signal: any) => {
    if (pc.signalingState === "closed" || remoteDescSet.current) return;
    await pc.setRemoteDescription(new RTCSessionDescription(signal));
    remoteDescSet.current = true;
    console.log(`[SDP] Remote description set, adding ${pendingCandidates.current.length} pending candidates`);
    for (const c of pendingCandidates.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
    }
    pendingCandidates.current = [];
  };

  // ── Attach remote stream (⭐ audio fix: always re-attach, no guard) ──
  const attachRemoteStream = (stream: MediaStream) => {
    const el = remoteVideoRef.current;
    if (!el) return;
    if (el.srcObject !== stream) {
      console.log(`[VIDEO] Attaching remote stream (${stream.getTracks().map(t => t.kind).join(", ")})`);
      el.srcObject = stream;
    }
    el.volume = 1.0;
    const tryPlay = () => {
      el.play().catch(() => setTimeout(tryPlay, 500));
    };
    el.onloadedmetadata = tryPlay;
    tryPlay();
  };

  useEffect(() => {
    callEnded.current = false;
    fetchIceServers().then(startCall);

    const onCallAccepted = async ({ signal }: { signal: any }) => {
      console.log("[SIGNAL] callAccepted received");
      const pc = peerRef.current;
      if (!pc || pc.signalingState === "closed") return;
      await setRemoteDescAndFlush(pc, signal);
      // ⭐ Receiver has mounted VideoCall — now safe to send buffered candidates
      peerReady.current = true;
      flushOutgoingCandidates();
      setCallStatus("connected");
    };

    const onIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      if (!candidate) return;
      const pc = peerRef.current;
      if (!pc || pc.signalingState === "closed") return;
      if (remoteDescSet.current) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      } else {
        pendingCandidates.current.push(candidate);
      }
    };

    const onCallRejected = () => {
      if (callEnded.current) return;
      callEnded.current = true;
      setCallStatus("ended");
      setTimeout(onClose, 1500);
    };

    const onCallEnded = () => {
      if (callEnded.current) return;
      callEnded.current = true;
      setCallStatus("ended");
      setTimeout(onClose, 1500);
    };

    socket.on("callAccepted", onCallAccepted);
    socket.on("iceCandidate", onIceCandidate);
    socket.on("callRejected", onCallRejected);
    socket.on("callEnded", onCallEnded);

    return () => {
      socket.off("callAccepted", onCallAccepted);
      socket.off("iceCandidate", onIceCandidate);
      socket.off("callRejected", onCallRejected);
      socket.off("callEnded", onCallEnded);
      cleanup();
    };
  }, []);

  const startCall = async (servers: RTCIceServer[]) => {
    if (callEnded.current) return;
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        console.warn("[MEDIA] Camera unavailable, audio only");
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
        iceCandidatePoolSize: 10,
      });
      peerRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        console.log(`[TRACK] ontrack: ${event.track.kind}, streams: ${event.streams.length}`);
        if (event.streams[0]) {
          attachRemoteStream(event.streams[0]);
          setCallStatus("connected");
        }
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate) {
          console.log("[ICE] Gathering complete");
          return;
        }
        const c = event.candidate.candidate;
        const type = c.includes("relay") ? "TURN" : c.includes("srflx") ? "STUN" : "host";
        const json = event.candidate.toJSON();

        if (peerReady.current) {
          console.log(`[ICE] Candidate sent: ${type}`);
          sendCandidate(json);
        } else {
          // ⭐ Caller: receiver hasn't accepted yet → buffer
          console.log(`[ICE] Candidate buffered: ${type}`);
          outgoingCandidates.current.push(json);
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log(`[ICE] State: ${state}`);
        if (state === "connected" || state === "completed") {
          setCallStatus("connected");
        } else if (state === "failed") {
          console.warn("[ICE] Failed, restarting...");
          pc.restartIce();
        } else if (state === "disconnected") {
          setTimeout(() => {
            if (callEnded.current) return;
            if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
              console.warn("[ICE] Still disconnected, restarting...");
              pc.restartIce();
              setTimeout(() => {
                if (callEnded.current) return;
                if (pc.iceConnectionState !== "connected" && pc.iceConnectionState !== "completed") {
                  console.error("[ICE] Failed after retry");
                  callEnded.current = true;
                  setCallStatus("ended");
                  setTimeout(onClose, 2000);
                }
              }, 15000);
            }
          }, 15000);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[CONN] State: ${pc.connectionState}`);
        if (pc.connectionState === "connected") {
          setCallStatus("connected");
        } else if (pc.connectionState === "failed") {
          console.warn("[CONN] Failed, restarting ICE...");
          pc.restartIce();
          setTimeout(() => {
            if (callEnded.current) return;
            if (pc.connectionState !== "connected") {
              callEnded.current = true;
              setCallStatus("ended");
              setTimeout(onClose, 2000);
            }
          }, 15000);
        }
      };

      if (isIncoming && incomingSignal) {
        console.log("[CALL] Incoming: setting remote desc + creating answer");
        await setRemoteDescAndFlush(pc, incomingSignal);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answerCall", { callerId: contact.id, signal: answer });
        console.log("[CALL] Answer sent to caller");
      } else {
        console.log("[CALL] Outgoing: creating offer");
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        socket.emit("callUser", { receiverId: contact.id, signal: offer });
        console.log("[CALL] Offer sent to receiver (ICE candidates buffered until accept)");
      }
    } catch (err) {
      console.error("[CALL] Init error:", err);
      if (!callEnded.current) {
        callEnded.current = true;
        setCallStatus("ended");
        setTimeout(onClose, 2000);
      }
    }
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current = null;
    remoteDescSet.current = false;
    pendingCandidates.current = [];
    outgoingCandidates.current = [];
  };

  const endCall = () => {
    callEnded.current = true;
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
        if (localVideoRef.current) localVideoRef.current.srcObject = screen;
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

  const showOverlay = callStatus !== "connected";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden">

        {/* Remote video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted={false}
          className={`w-full h-full object-cover transition-opacity duration-500 ${showOverlay ? "opacity-0" : "opacity-100"}`}
        />

        {/* Waiting overlay */}
        {showOverlay && (
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