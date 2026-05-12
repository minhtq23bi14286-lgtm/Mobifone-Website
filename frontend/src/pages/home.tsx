import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle, Bell, ChevronRight,
  ThumbsUp, Clock, Megaphone, Zap, TrendingUp,
  Calendar, Newspaper, MapPin, Tag
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

interface Post {
  id: number; userId: number; title: string; content: string; category: string;
  likes: number; comments: number; views: number; createdAt: string;
  authorName?: string; authorRole?: string;
}

interface OnlineUser {
  id: number; displayName: string; department: string; role: string;
}

const ANNOUNCEMENTS = [
  { id: 1, title: "Họp toàn công ty Q2/2026", desc: "Thứ Sáu, 25/04 lúc 9:00 AM tại Hội trường A", color: "from-blue-500 to-[#1F4E79]", icon: Megaphone },
  { id: 2, title: "Cập nhật chính sách bảo mật nội bộ", desc: "Hiệu lực từ 01/05/2026 — vui lòng đọc kỹ", color: "from-orange-400 to-orange-600", icon: Bell },
  { id: 3, title: "Deadline báo cáo Q1: 30/04/2026", desc: "Nộp qua cổng nội bộ trước 17:00", color: "from-red-400 to-rose-600", icon: Clock },
];

const DEPARTMENT_NEWS = [
  { id: 1, title: "Ra mắt gói cước 5G MobiFone Ultra tốc độ cao", department: "Kinh doanh", deptColor: "bg-emerald-100 text-emerald-700", summary: "MobiFone chính thức triển khai gói cước 5G tốc độ cao mới nhất, phủ sóng 63 tỉnh thành trên toàn quốc từ tháng 5/2026.", date: "22/04/2026", gradient: "from-emerald-400 to-teal-500" },
  { id: 2, title: "Nâng cấp hệ thống core network Q2/2026", department: "IT", deptColor: "bg-blue-100 text-blue-700", summary: "Phòng IT hoàn thành lộ trình nâng cấp hạ tầng mạng lõi, đảm bảo uptime 99.99% phục vụ khách hàng toàn quốc.", date: "20/04/2026", gradient: "from-blue-400 to-indigo-500" },
  { id: 3, title: "Chiến dịch tuyển dụng nhân tài công nghệ 2026", department: "HR", deptColor: "bg-purple-100 text-purple-700", summary: "HR mở 50 vị trí tuyển dụng cho các kỹ sư phần mềm, chuyên gia AI và data analyst trong Q2/2026.", date: "18/04/2026", gradient: "from-purple-400 to-violet-500" },
  { id: 4, title: "Kết quả khảo sát hài lòng khách hàng Q1", department: "Marketing", deptColor: "bg-orange-100 text-orange-700", summary: "Chỉ số NPS đạt 78 điểm, tăng 12 điểm so với cùng kỳ năm ngoái.", date: "15/04/2026", gradient: "from-orange-400 to-amber-500" },
];

const UPCOMING_EVENTS = [
  { id: 1, title: "Họp toàn công ty Q2", date: "2026-04-25", time: "09:00", location: "Hội trường A, Tầng 10", typeLabel: "Họp", color: "from-[#1F4E79] to-[#2E75B6]", tagColor: "bg-blue-100 text-blue-700" },
  { id: 2, title: "Deadline nộp báo cáo Q1", date: "2026-04-30", time: "17:00", location: "Cổng nội bộ", typeLabel: "Deadline", color: "from-red-500 to-rose-600", tagColor: "bg-red-100 text-red-700" },
  { id: 3, title: "Khóa đào tạo an ninh mạng", date: "2026-05-05", time: "08:30", location: "Phòng Training B, Tầng 6", typeLabel: "Đào tạo", color: "from-emerald-500 to-teal-600", tagColor: "bg-emerald-100 text-emerald-700" },
  { id: 4, title: "Team Building IT Department", date: "2026-05-10", time: "07:00", location: "Khu du lịch Đại Lải", typeLabel: "Sự kiện", color: "from-purple-500 to-violet-600", tagColor: "bg-purple-100 text-purple-700" },
];

const POST_COLORS = ["from-blue-500 to-indigo-600","from-pink-500 to-rose-600","from-green-500 to-teal-600","from-purple-500 to-violet-600","from-orange-500 to-amber-600"];

const formatTime = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

const getDaysUntil = (dateStr: string) => {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  if (diff < 0) return "Đã qua";
  return `${diff} ngày nữa`;
};

const formatEventDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function Home() {
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("/api/posts", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setPosts(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (err) { console.error(err); }
      finally { setIsLoadingPosts(false); }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setOnlineUsers(Array.isArray(data) ? data.filter((u: OnlineUser) => u.id !== currentUser.id).slice(0, 4) : []);
      } catch (err) { console.error(err); }
    };
    fetchUsers();
  }, []);

  const bg = darkMode ? "bg-[#131929]" : "bg-gray-50";
  const card = darkMode ? "bg-[#1a2540] border-[#2a3a5c]" : "bg-white border-gray-100";
  const textMain = darkMode ? "text-white" : "text-gray-800";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const hoverRow = darkMode ? "hover:bg-[#1f2e4a]" : "hover:bg-gray-50";
  const divider = darkMode ? "border-[#2a3a5c]" : "border-gray-100";

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${bg} transition-colors duration-300`}>

      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d2d4f] via-[#1F4E79] to-[#2E75B6]" />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-white/5" />
        <div className="relative px-5 md:px-8 py-8 md:py-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white/80 text-xs font-medium">MobiFone Internal Network</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
            Xin chào, {currentUser.displayName || "bạn"}! 👋
          </h1>
          <p className="text-blue-200 text-sm md:text-base max-w-xl">
            Kết nối — Chia sẻ — Cùng nhau phát triển cùng đội ngũ MobiFone
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">

        {/* Row 1: Activity Feed + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Activity Feed */}
          <div className={`lg:col-span-2 rounded-2xl shadow-sm border ${card} overflow-hidden`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${divider}`}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1F4E79]" />
                <h2 className={`font-bold ${textMain}`}>Hoạt động mới nhất</h2>
              </div>
              <button onClick={() => navigate("/forum")}
                className="flex items-center gap-1 text-xs text-[#1F4E79] hover:underline font-medium">
                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className={`divide-y ${divider}`}>
              {isLoadingPosts && <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#1F4E79] border-t-transparent rounded-full animate-spin" /></div>}
              {!isLoadingPosts && posts.length === 0 && <div className={`py-10 text-center text-sm ${textSub}`}>Chưa có bài đăng nào</div>}
              {posts.map((post, index) => (
                <div key={post.id} onClick={() => navigate("/forum")}
                  className={`flex gap-4 px-5 py-4 cursor-pointer transition-colors ${hoverRow}`}>
                  <div className={`w-1 rounded-full bg-gradient-to-b ${POST_COLORS[index % POST_COLORS.length]} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={`font-semibold text-sm leading-snug line-clamp-1 ${textMain}`}>{post.title}</h3>
                      <span className={`text-xs flex-shrink-0 ${textSub}`}>{formatTime(post.createdAt)}</span>
                    </div>
                    <p className={`text-xs line-clamp-2 mb-2 ${textSub}`}>{post.content}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-[#1F4E79]"}`}>{post.category}</span>
                      <div className={`flex items-center gap-1 text-xs ${textSub}`}><ThumbsUp className="w-3 h-3" />{post.likes}</div>
                      <div className={`flex items-center gap-1 text-xs ${textSub}`}><MessageCircle className="w-3 h-3" />{post.comments}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Announcements + Online Members */}
          <div className="space-y-4">
            <div className={`rounded-2xl shadow-sm border ${card} overflow-hidden`}>
              <div className={`px-5 py-4 border-b flex items-center gap-2 ${divider}`}>
                <Zap className="w-4 h-4 text-orange-500" />
                <h2 className={`font-bold ${textMain}`}>Thông báo</h2>
              </div>
              <div className="p-4 space-y-3">
                {ANNOUNCEMENTS.map(ann => (
                  <div key={ann.id} className={`rounded-xl p-3 cursor-pointer transition-colors ${hoverRow}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ann.color} flex items-center justify-center flex-shrink-0`}>
                        <ann.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold leading-snug ${textMain}`}>{ann.title}</p>
                        <p className={`text-xs mt-0.5 leading-relaxed ${textSub}`}>{ann.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl shadow-sm border ${card} overflow-hidden`}>
              <div className={`px-5 py-4 border-b flex items-center justify-between ${divider}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <h2 className={`font-bold ${textMain}`}>Thành viên</h2>
                </div>
                <button onClick={() => navigate("/chat")} className="text-xs text-[#1F4E79] hover:underline font-medium flex items-center gap-1">
                  Nhắn tin <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {onlineUsers.length === 0 && <p className={`text-xs text-center py-2 ${textSub}`}>Đang tải...</p>}
                {onlineUsers.map(user => (
                  <div key={user.id} onClick={() => navigate("/chat")}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${hoverRow}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{user.displayName.charAt(0)}</span>
                      </div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 ${darkMode ? "border-[#1a2540]" : "border-white"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${textMain}`}>{user.displayName}</p>
                      <p className={`text-xs truncate ${textSub}`}>{user.department || user.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Department News + Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* Department News */}
          <div className={`lg:col-span-2 rounded-2xl shadow-sm border ${card} overflow-hidden`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${divider}`}>
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#1F4E79]" />
                <h2 className={`font-bold ${textMain}`}>Tin tức phòng ban</h2>
              </div>
              <span className={`text-xs ${textSub}`}>Cập nhật bởi Admin</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {DEPARTMENT_NEWS.map((news, index) => (
                <div key={news.id}
                  className={`p-5 cursor-pointer transition-colors ${hoverRow} ${
                    index % 2 === 0 ? `sm:border-r ${divider}` : ""
                  } ${index < 2 ? `border-b ${divider}` : ""}`}>
                  <div className={`w-full h-1 rounded-full bg-gradient-to-r ${news.gradient} mb-3`} />
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${news.deptColor} inline-flex items-center gap-1 mb-2`}>
                    <Tag className="w-2.5 h-2.5" />{news.department}
                  </span>
                  <h3 className={`font-semibold text-sm leading-snug mb-1.5 line-clamp-2 ${textMain}`}>{news.title}</h3>
                  <p className={`text-xs leading-relaxed line-clamp-2 mb-2 ${textSub}`}>{news.summary}</p>
                  <p className={`text-xs ${textSub}`}>{news.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className={`rounded-2xl shadow-sm border ${card} overflow-hidden`}>
            <div className={`px-5 py-4 border-b flex items-center gap-2 ${divider}`}>
              <Calendar className="w-4 h-4 text-[#1F4E79]" />
              <h2 className={`font-bold ${textMain}`}>Sự kiện sắp tới</h2>
            </div>
            <div className="p-4 space-y-3">
              {UPCOMING_EVENTS.map(event => {
                const daysUntil = getDaysUntil(event.date);
                const isUrgent = daysUntil === "Hôm nay" || daysUntil === "Ngày mai";
                return (
                  <div key={event.id}
                    className={`rounded-xl p-3 cursor-pointer transition-colors border ${darkMode ? "border-[#2a3a5c] hover:bg-[#1f2e4a]" : "border-gray-100 hover:bg-gray-50"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${event.color} flex flex-col items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-[10px] font-bold leading-none">{new Date(event.date).getDate()}</span>
                        <span className="text-white/80 text-[9px] leading-none mt-0.5">Th{new Date(event.date).getMonth() + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <p className={`text-xs font-semibold leading-snug line-clamp-1 ${textMain}`}>{event.title}</p>
                          {isUrgent && <span className="text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">{daysUntil}</span>}
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] mb-1 ${textSub}`}>
                          <Clock className="w-2.5 h-2.5" />{event.time} • {formatEventDate(event.date)}
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] ${textSub}`}>
                          <MapPin className="w-2.5 h-2.5" /><span className="truncate">{event.location}</span>
                        </div>
                        {!isUrgent && <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${event.tagColor}`}>{daysUntil}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}