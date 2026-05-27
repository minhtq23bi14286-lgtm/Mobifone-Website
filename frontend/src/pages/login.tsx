import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, X, MessageSquare, Shield, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

function SimpleCaptcha({ onVerify }: { onVerify: (verified: boolean) => void }) {
  const generateQuestion = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { question: `${a} + ${b} = ?`, answer: String(a + b) };
  };

  const [captcha, setCaptcha] = useState(generateQuestion());
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleCheck = (value: string) => {
    setInput(value);
    if (value === captcha.answer) {
      setError(false);
      onVerify(true);
    } else {
      onVerify(false);
      if (value.length >= captcha.answer.length) setError(true);
    }
  };

  const refresh = () => {
    setCaptcha(generateQuestion());
    setInput("");
    setError(false);
    onVerify(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-1">Xác minh CAPTCHA</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700 bg-white px-3 py-1 rounded-lg border border-gray-200 select-none font-mono tracking-widest">
            {captcha.question}
          </span>
          <input
            type="text"
            placeholder="?"
            value={input}
            onChange={(e) => handleCheck(e.target.value)}
            maxLength={3}
            className={`w-16 text-center h-8 border rounded-lg text-sm focus:outline-none transition-colors ${
              error
                ? "border-red-400 bg-red-50 text-red-600"
                : input === captcha.answer
                  ? "border-green-400 bg-green-50 text-green-600"
                  : "border-gray-300 focus:border-[#1F4E79]"
            }`}
          />
          {input === captcha.answer && (
            <span className="text-green-500 text-xs font-medium">✓ Đúng!</span>
          )}
          {error && <span className="text-red-500 text-xs">Sai!</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={refresh}
        className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"method" | "verify" | "success">("method");
  const [method, setMethod] = useState<"email" | "sms" | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = () => {
    if (!captchaVerified) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("verify");
      startCountdown();
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {step === "method" && "Quên mật khẩu"}
              {step === "verify" && "Xác thực OTP"}
              {step === "success" && "Thành công!"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {step === "method" && "Chọn phương thức nhận mã xác thực"}
              {step === "verify" && `Nhập mã 6 số được gửi đến ${method === "email" ? email : phone}`}
              {step === "success" && "Mật khẩu mới đã được gửi"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === "method" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-700">Phương thức xác thực</p>

              <button
                type="button"
                onClick={() => setMethod("email")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  method === "email" ? "border-[#1F4E79] bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  method === "email" ? "bg-[#1F4E79]" : "bg-gray-100"
                }`}>
                  <Mail className={`w-5 h-5 ${method === "email" ? "text-white" : "text-gray-500"}`} />
                </div>
                <div className="text-left flex-1">
                  <p className={`text-sm font-semibold ${method === "email" ? "text-[#1F4E79]" : "text-gray-700"}`}>
                    Qua Email
                  </p>
                  <p className="text-xs text-gray-500">Nhận mã OTP qua email doanh nghiệp</p>
                </div>
                {method === "email" && (
                  <div className="w-5 h-5 bg-[#1F4E79] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMethod("sms")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  method === "sms" ? "border-[#1F4E79] bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  method === "sms" ? "bg-[#1F4E79]" : "bg-gray-100"
                }`}>
                  <MessageSquare className={`w-5 h-5 ${method === "sms" ? "text-white" : "text-gray-500"}`} />
                </div>
                <div className="text-left flex-1">
                  <p className={`text-sm font-semibold ${method === "sms" ? "text-[#1F4E79]" : "text-gray-700"}`}>
                    Qua SMS
                  </p>
                  <p className="text-xs text-gray-500">Nhận mã OTP qua số điện thoại</p>
                </div>
                {method === "sms" && (
                  <div className="w-5 h-5 bg-[#1F4E79] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>

              {method === "email" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email doanh nghiệp</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="name@mobifone.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 h-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {method === "sms" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="0912 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 h-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#1F4E79] bg-gray-50"
                    />
                  </div>
                </div>
              )}

              {method && <SimpleCaptcha onVerify={setCaptchaVerified} />}

              <button
                type="button"
                onClick={handleSendCode}
                disabled={!method || !captchaVerified || (!email && !phone) || loading}
                className="w-full h-10 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </div>
                ) : "Gửi mã xác thực"}
              </button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-[#1F4E79]" />
                </div>
                <p className="text-sm text-gray-600">
                  Mã OTP đã được gửi đến
                  <span className="font-semibold text-gray-800 block">
                    {method === "email" ? email : phone}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Nhập mã 6 số</p>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#1F4E79] transition-colors"
                    />
                  ))}
                </div>
              </div>
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-gray-500">
                    Gửi lại mã sau <span className="font-bold text-[#1F4E79]">{countdown}s</span>
                  </p>
                ) : (
                  <button type="button" onClick={startCountdown} className="text-xs text-[#1F4E79] hover:underline font-medium">
                    Gửi lại mã
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("method")}
                  className="flex-1 h-10 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={otp.some(d => !d) || loading}
                  className="flex-1 h-10 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xác thực...
                    </div>
                  ) : "Xác thực"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <p className="font-bold text-gray-800">Xác thực thành công!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Mật khẩu mới đã được gửi đến {method === "email" ? email : phone}.
                  Vui lòng kiểm tra và đăng nhập lại.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
  const data = await response.json().catch(() => ({}));

  // Account locked → redirect to Access Denied page
  if (
  response.status === 403 ||
  data.message?.toLowerCase().includes("locked") ||
  data.message?.toLowerCase().includes("blocked") ||
  data.message?.includes("tạm khóa")
  ){
    navigate("/access-denied");
    return;
  }

  setError(data.message || "Email hoặc mật khẩu không đúng!");
  return;
}

      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "admin") {
  navigate("/admin");
} else {
  navigate("/home");
}
    } catch (err) {
      setError("Lỗi kết nối server. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center p-4 overflow-hidden">

      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/1614670187172_tru-so-mobifone_nguon_bao_giao_thong.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 z-10 bg-black/55" />

      <div className="relative z-20 w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          <div className="text-center mb-8">
            <div className="text-4xl font-bold italic tracking-tight mb-1">
              <span className="text-[#0066CC]">mobi</span>
              <span className="text-[#FF0000]">f</span>
              <span className="text-[#0066CC]">one</span>
            </div>
            <p className="text-[#0066CC] text-xs italic tracking-widest mb-5">
              mọi lúc - mọi nơi
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Chào mừng trở lại!</h1>
            <p className="text-gray-500 mt-1 text-sm">Đăng nhập vào MobiFone Internal</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="name@mobifone.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 h-11 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-[#1F4E79] hover:text-[#2E75B6] font-medium transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] hover:from-[#1a4268] hover:to-[#2563a8] text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang đăng nhập...
                </div>
              ) : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © 2026 MobiFone Internal Social Network
          </p>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}