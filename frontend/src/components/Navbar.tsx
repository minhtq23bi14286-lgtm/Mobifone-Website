import { useNavigate, useLocation } from "react-router-dom";
import { Bell, ChevronDown, Search, LogOut, Settings, User, MessageCircle, Phone, FileText, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { io, Socket } from "socket.io-client";

const navItems = [
  { label: "Trang chủ", path: "/home" },
  { label: "Tin nhắn", path: "/chat" },
  { label: "Diễn đàn", path: "/forum" },
  { label: "Liên hệ", path: "/contact" },
];

interface Notification {
  id?: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: number;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useThemeStore();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Load thông báo từ API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const response = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error("Lỗi load notifications:", err);
      }
    };
    fetchNotifications();
  }, []);

  // Kết nối socket để nhận thông báo real-time
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || socketRef.current) return;

    const socket = io({ auth: { token } });
    socketRef.current = socket;

    socket.on("newNotification", (notif: Notification) => {
      setNotifications(prev => [{ ...notif, isRead: false }, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id?: number) => {
    if (!id) return;
    try {
      const token = localStorage.getItem("accessToken");
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "message": return <MessageCircle className="w-4 h-4 text-white" />;
      case "call": return <Phone className="w-4 h-4 text-white" />;
      case "post": return <FileText className="w-4 h-4 text-white" />;
      case "user_online": return <Users className="w-4 h-4 text-white" />;
      default: return <Bell className="w-4 h-4 text-white" />;
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case "message": return "from-blue-500 to-blue-600";
      case "call": return "from-green-500 to-green-600";
      case "post": return "from-purple-500 to-purple-600";
      case "user_online": return "from-orange-500 to-orange-600";
      default: return "from-[#1F4E79] to-[#2E75B6]";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  return (
    <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
      darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-100"
    }`}>
      <div className="flex items-center justify-between px-6 h-14">

        {/* Logo + Nav items */}
        <div className="flex items-center gap-6">
          <div
            className="text-xl font-bold italic cursor-pointer flex-shrink-0"
            onClick={() => navigate("/home")}
          >
            <span className="text-[#0066CC]">mobi</span>
            <span className="text-[#FF0000]">f</span>
            <span className="text-[#0066CC]">one</span>
          </div>

          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#1F4E79] text-white"
                      : darkMode
                        ? "text-gray-400 hover:text-white hover:bg-white/10"
                        : "text-gray-600 hover:text-[#1F4E79] hover:bg-blue-50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-9 pr-4 py-1.5 rounded-lg text-sm w-40 focus:w-56 transition-all duration-300 focus:outline-none ${
                darkMode
                  ? "bg-white/5 text-white placeholder-gray-500 focus:bg-white/10"
                  : "bg-gray-100 text-gray-800 placeholder-gray-400 focus:bg-gray-200"
              }`}
            />
          </div>

          {/* Notification */}
          <div className="relative">
            <button
              onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
              className={`relative p-2 rounded-lg transition-colors ${
                darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div className={`absolute right-0 top-10 w-80 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
                darkMode ? "bg-[#1a2540] border-white/10" : "bg-white border-gray-100"
              }`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${
                  darkMode ? "border-white/5" : "border-gray-100"
                }`}>
                  <h3 className={`font-bold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>
                    Thông báo {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}
                  </h3>
                  {unreadCount > 0 && (
                    <span
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#2E75B6] font-medium cursor-pointer hover:underline"
                    >
                      Đánh dấu tất cả đã đọc
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Bell className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-xs text-gray-400">Không có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.map((notif, i) => (
                      <div
                        key={i}
                        onClick={() => handleMarkRead(notif.id)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          !notif.isRead
                            ? darkMode ? "bg-blue-500/10" : "bg-blue-50/50"
                            : ""
                        } ${darkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                      >
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getNotifColor(notif.type)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                            {notif.title}
                          </p>
                          <p className={`text-xs leading-relaxed mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {notif.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.createdAt ? formatTime(notif.createdAt) : ""}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <div className="w-2 h-2 bg-[#1F4E79] rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className={`px-4 py-2 border-t text-center ${darkMode ? "border-white/5" : "border-gray-100"}`}>
                  <button className="text-xs text-[#2E75B6] hover:underline font-medium">
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                darkMode ? "hover:bg-white/10" : "hover:bg-gray-100"
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {currentUser?.displayName?.charAt(0) || "U"}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className={`text-xs font-semibold leading-none ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {currentUser?.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentUser?.role === "admin" ? "Admin" : "Employee"}
                </p>
              </div>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`} />
            </button>

            {showProfile && (
              <div className={`absolute right-0 top-10 w-56 rounded-2xl shadow-2xl border overflow-hidden z-50 ${
                darkMode ? "bg-[#1a2540] border-white/10" : "bg-white border-gray-100"
              }`}>
                <div className={`px-4 py-3 border-b ${darkMode ? "border-white/5" : "border-gray-100"}`}>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {currentUser?.displayName || "User"}
                  </p>
                  <p className="text-xs text-gray-500">{currentUser?.email || ""}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { navigate("/settings"); setShowProfile(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                      darkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => { navigate("/settings"); setShowProfile(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                      darkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Cài đặt
                    <button
  onClick={() => { navigate("/contact"); setShowProfile(false); }}
  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
    darkMode ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-50"
  }`}
>
  <MessageCircle className="w-4 h-4" />
  Liên hệ & Hỗ trợ
</button>
                  </button>
                  <div className={`my-1 h-px ${darkMode ? "bg-white/5" : "bg-gray-100"}`} />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}