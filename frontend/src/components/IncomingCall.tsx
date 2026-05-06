import { Phone, PhoneOff } from "lucide-react";

interface IncomingCallProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCall({ callerName, onAccept, onReject }: IncomingCallProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-80 text-center shadow-2xl">

        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white text-3xl font-bold">{callerName.charAt(0)}</span>
        </div>

        <p className="text-gray-500 text-sm mb-1">Cuộc gọi video đến</p>
        <p className="text-gray-800 text-xl font-bold mb-8">{callerName}</p>

        <div className="flex items-center justify-center gap-8">
          {/* Từ chối */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onReject}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            <span className="text-xs text-gray-500">Từ chối</span>
          </div>

          {/* Chấp nhận */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
            >
              <Phone className="w-6 h-6 text-white" />
            </button>
            <span className="text-xs text-gray-500">Chấp nhận</span>
          </div>
        </div>
      </div>
    </div>
  );
}