import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';

const AccessDenied: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Shield icon with pulse */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute w-28 h-28 bg-red-500/20 rounded-full animate-ping" />
          <div className="absolute w-24 h-24 bg-red-500/10 rounded-full animate-pulse" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
            <ShieldOff className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Error code */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-sm font-mono tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            ERROR 403 — ACCESS DENIED
          </span>
        </div>

        {/* Main heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Account Locked
        </h1>

        {/* Description */}
        <p className="text-gray-400 text-lg mb-3 leading-relaxed">
          Your account has been temporarily locked due to{' '}
          <span className="text-red-400 font-semibold">
            multiple failed login attempts
          </span>
          .
        </p>

        <p className="text-gray-500 text-sm mb-8">
          This security measure protects MobiFone's internal network from
          unauthorized access. Please contact your system administrator to
          unlock your account.
        </p>

        {/* Warning box */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-yellow-400 font-medium text-sm mb-1">
                Security Notice
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                All login attempts have been logged and reported to the IT
                Security team. If you believe this is an error, please contact
                your administrator with your employee ID.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>

        {/* Auto redirect countdown */}
        <p className="text-gray-600 text-xs mt-6">
          Redirecting to login page in{' '}
          <span className="text-gray-400 font-mono">{countdown}s</span>
        </p>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/5">
          <p className="text-gray-600 text-xs">
            MobiFone Internal Network Security System
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;