import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell, ChevronDown, Search, LogOut, Settings,
  MessageCircle, Phone, FileText, Users, Menu, X,
  Home, MessageSquare, BookOpen, HeadphonesIcon,
  Megaphone, Calendar, Building2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { io, Socket } from "socket.io-client";

const navItems = [
  { label: "Trang chủ", path: "/home",    icon: Home },
  { label: "Tin nhắn",  path: "/chat",    icon: MessageSquare },
  { label: "Diễn đàn",  path: "/forum",   icon: BookOpen },
  { label: "Liên hệ",   path: "/contact", icon: HeadphonesIcon },
];

interface Notification {
  id?: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: number;
  commentId?: number;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useThemeStore();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = sessionStorage.getItem("accessToken");
        if (!token) return;
        const response = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) { console.error("Lỗi load notifications:", err); }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token || socketRef.current) return;
    const socket = io({ auth: { token } });
    socketRef.current = socket;
    socket.on("newNotification", (notif: Notification) => {
      // Nếu là broadcast, chỉ thêm nếu không phải chính mình tạo
      setNotifications(prev => [{ ...notif, isRead: false }, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  // Đóng mobile menu khi navigate
  useEffect(() => { setShowMobileMenu(false); }, [location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const handleMarkRead = async (id?: number) => {
    if (!id) return;
    try {
      const token = sessionStorage.getItem("accessToken");
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  // 🔔 Click notification → navigate đến đúng trang
  const handleNotifClick = async (notif: Notification) => {
    await handleMarkRead(notif.id);
    setShowNotif(false);

    switch (notif.type) {
      case "message":
        // referenceId = senderId → navigate đến chat với người đó
        if (notif.referenceId) {
          navigate(`/chat?userId=${notif.referenceId}`);
        } else {
          navigate("/chat");
        }
        break;

      case "call":
        navigate("/chat");
        break;

      case "comment":
        // referenceId = postId, commentId = specific comment → highlight it
        if (notif.referenceId) {
          const params = new URLSearchParams({ postId: String(notif.referenceId) });
          if (notif.commentId) params.set("commentId", String(notif.commentId));
          navigate(`/forum?${params.toString()}`);
        } else {
          navigate("/forum");
        }
        break;

      case "post_approved":
      case "post_rejected":
      case "post":
        // referenceId = postId → navigate đến bài viết
        if (notif.referenceId) {
          navigate(`/forum?postId=${notif.referenceId}`);
        } else {
          navigate("/forum");
        }
        break;

      case "announcement":
      case "event":
      case "department_news":
        // Tin tức, sự kiện, thông báo → về trang chủ
        navigate("/home");
        break;

      case "user_online":
        navigate("/chat");
        break;

      default:
        navigate("/home");
        break;
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "message":       return <MessageCircle className="w-4 h-4 text-white" />;
      case "call":          return <Phone className="w-4 h-4 text-white" />;
      case "comment":       return <MessageSquare className="w-4 h-4 text-white" />;
      case "post":
      case "post_approved":
      case "post_rejected": return <FileText className="w-4 h-4 text-white" />;
      case "announcement":  return <Megaphone className="w-4 h-4 text-white" />;
      case "event":         return <Calendar className="w-4 h-4 text-white" />;
      case "department_news": return <Building2 className="w-4 h-4 text-white" />;
      case "user_online":   return <Users className="w-4 h-4 text-white" />;
      default:              return <Bell className="w-4 h-4 text-white" />;
    }
  };

  const getNotifColor = (type: string) => {
    switch (type) {
      case "message":        return "from-blue-500 to-blue-600";
      case "call":           return "from-green-500 to-green-600";
      case "comment":        return "from-indigo-500 to-indigo-600";
      case "post":
      case "post_approved":  return "from-emerald-500 to-emerald-600";
      case "post_rejected":  return "from-red-500 to-red-600";
      case "announcement":   return "from-amber-500 to-amber-600";
      case "event":          return "from-cyan-500 to-cyan-600";
      case "department_news":return "from-teal-500 to-teal-600";
      case "user_online":    return "from-orange-500 to-orange-600";
      default:               return "from-[#1F4E79] to-[#2E75B6]";
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Vừa xong";
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const dm = darkMode;
  const navBg    = dm ? "bg-[#161b27] border-white/5" : "bg-white border-gray-100";
  const textMain = dm ? "text-white" : "text-gray-800";
  const textSub  = dm ? "text-gray-400" : "text-gray-500";
  const hoverBg  = dm ? "hover:bg-white/10" : "hover:bg-gray-100";
  const dropBg   = dm ? "bg-[#1a2540] border-white/10" : "bg-white border-gray-100";
  const divider  = dm ? "border-white/5" : "border-gray-100";

  return (
    <>
      <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${navBg}`}>
        <div className="flex items-center justify-between px-4 md:px-6 h-14">

          {/* Logo + desktop nav */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="text-xl font-bold italic cursor-pointer flex-shrink-0"
              onClick={() => navigate("/home")}>
              <span className="text-[#0066CC]">mobi</span>
              <span className="text-[#FF0000]">f</span>
              <span className="text-[#0066CC]">one</span>
            </div>

            {/* Desktop nav items */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#1F4E79] text-white"
                        : dm
                          ? "text-gray-400 hover:text-white hover:bg-white/10"
                          : "text-gray-600 hover:text-[#1F4E79] hover:bg-blue-50"
                    }`}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-1 md:gap-2">

            {/* Search — desktop only */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Tìm kiếm..." value={search}
                onChange={e => setSearch(e.target.value)}
                className={`pl-9 pr-4 py-1.5 rounded-lg text-sm w-40 focus:w-56 transition-all duration-300 focus:outline-none ${
                  dm ? "bg-white/5 text-white placeholder-gray-500 focus:bg-white/10"
                     : "bg-gray-100 text-gray-800 placeholder-gray-400 focus:bg-gray-200"
                }`} />
            </div>

            {/* Notification */}
            <div className="relative">
              <button onClick={() => { setShowNotif(!showNotif); setShowProfile(false); setShowMobileMenu(false); }}
                className={`relative p-2 rounded-lg transition-colors ${
                  dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                }`}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className={`absolute right-0 top-10 w-80 max-w-[calc(100vw-1rem)] rounded-2xl shadow-2xl border overflow-hidden z-50 ${dropBg}`}>
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
                    <h3 className={`font-bold text-sm ${textMain}`}>
                      Thông báo {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}
                    </h3>
                    {unreadCount > 0 && (
                      <span onClick={handleMarkAllRead}
                        className="text-xs text-[#2E75B6] font-medium cursor-pointer hover:underline">
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
                    ) : notifications.map((notif, i) => (
                      <div key={notif.id || i} onClick={() => handleNotifClick(notif)}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          !notif.isRead ? dm ? "bg-blue-500/10" : "bg-blue-50/50" : ""
                        } ${dm ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getNotifColor(notif.type)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${textMain}`}>{notif.title}</p>
                          <p className={`text-xs leading-relaxed mt-0.5 ${textSub}`}>{notif.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.createdAt ? formatTime(notif.createdAt) : ""}</p>
                        </div>
                        {!notif.isRead && <div className="w-2 h-2 bg-[#1F4E79] rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                    ))}
                  </div>
                  <div className={`px-4 py-2 border-t text-center ${divider}`}>
                    <button className="text-xs text-[#2E75B6] hover:underline font-medium">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile — desktop only */}
            <div className="relative hidden md:block">
              <button onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${hoverBg}`}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{currentUser?.displayName?.charAt(0) || "U"}</span>
                </div>
                <div className="text-left">
                  <p className={`text-xs font-semibold leading-none ${textMain}`}>{currentUser?.displayName || "User"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{currentUser?.role === "admin" ? "Admin" : "Employee"}</p>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showProfile ? "rotate-180" : ""}`} />
              </button>

              {showProfile && (
                <div className={`absolute right-0 top-10 w-56 rounded-2xl shadow-2xl border overflow-hidden z-50 ${dropBg}`}>
                  <div className={`px-4 py-3 border-b ${divider}`}>
                    <p className={`text-sm font-semibold ${textMain}`}>{currentUser?.displayName || "User"}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email || ""}</p>
                  </div>
                  <div className="p-2">
                    
                    <button onClick={() => { navigate("/settings"); setShowProfile(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${dm ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-50"}`}>
                      <Settings className="w-4 h-4" /> Cài đặt
                    </button>
                    
                    <div className={`my-1 h-px ${dm ? "bg-white/5" : "bg-gray-100"}`} />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: avatar */}
            <div className="md:hidden w-7 h-7 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center">
              <span className="text-white font-bold text-xs">{currentUser?.displayName?.charAt(0) || "U"}</span>
            </div>

            {/* Mobile: hamburger */}
            <button
              onClick={() => { setShowMobileMenu(!showMobileMenu); setShowNotif(false); setShowProfile(false); }}
              className={`md:hidden p-2 rounded-lg transition-colors ${hoverBg} ${textSub}`}>
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40 top-14">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileMenu(false)} />

          {/* Drawer */}
          <div className={`absolute left-0 top-0 w-72 h-full shadow-2xl ${dm ? "bg-[#161b27]" : "bg-white"}`}>

            {/* User info */}
            <div className={`px-5 py-4 border-b ${divider}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center">
                  <span className="text-white font-bold">{currentUser?.displayName?.charAt(0) || "U"}</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textMain}`}>{currentUser?.displayName || "User"}</p>
                  <p className={`text-xs ${textSub}`}>{currentUser?.email || ""}</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Tìm kiếm..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none ${
                    dm ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                       : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400"
                  }`} />
              </div>
            </div>

            {/* Nav items */}
            <div className="px-3 space-y-1">
              <p className={`text-xs font-bold uppercase tracking-widest px-2 mb-2 ${textSub}`}>Menu</p>
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#1F4E79] text-white"
                        : dm ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-50"
                    }`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className={`mx-4 my-3 h-px ${dm ? "bg-white/5" : "bg-gray-100"}`} />

            {/* Account */}
            <div className="px-3 space-y-1">
              <p className={`text-xs font-bold uppercase tracking-widest px-2 mb-2 ${textSub}`}>Tài khoản</p>
              <button onClick={() => navigate("/settings")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${dm ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-50"}`}>
                <Settings className="w-4 h-4" /> Cài đặt
              </button>
              <button onClick={() => navigate("/contact")}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors ${dm ? "text-gray-300 hover:bg-white/10" : "text-gray-600 hover:bg-gray-50"}`}>
                <MessageCircle className="w-4 h-4" /> Liên hệ & Hỗ trợ
              </button>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}