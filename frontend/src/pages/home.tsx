import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle, Bell, ChevronRight,
  ThumbsUp, Clock, Megaphone, Zap, TrendingUp,
  Calendar, Newspaper, MapPin, Tag, X, Eye,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

interface Post {
  id: number; userId: number; title: string; content: string; category: string;
  likes: number; comments: number; views: number; createdAt: string;
  authorName?: string; authorRole?: string;
}
interface OnlineUser { id: number; displayName: string; department: string; role: string; }
interface Announcement { id: number; title: string; description: string; icon: string; color: string; }
interface Event { id: number; title: string; date: string; time: string; location: string; typeLabel: string; color: string; tagColor: string; }
interface DepartmentNews { id: number; title: string; summary: string; department: string; deptColor: string; gradient: string; createdAt: string; }

const ICON_MAP: Record<string, any> = { bell: Bell, megaphone: Megaphone, clock: Clock, zap: Zap };
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

const formatFullDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const formatNewsDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function Home() {
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [departmentNews, setDepartmentNews] = useState<DepartmentNews[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = sessionStorage.getItem("accessToken");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
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
        const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setOnlineUsers(Array.isArray(data) ? data.filter((u: OnlineUser) => u.id !== currentUser.id).slice(0, 4) : []);
      } catch (err) { console.error(err); }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [annRes, evtRes, newsRes] = await Promise.all([
          fetch("/api/home/announcements", { headers }),
          fetch("/api/home/events",        { headers }),
          fetch("/api/home/news",          { headers }),
        ]);
        if (annRes.ok)  setAnnouncements(await annRes.json());
        if (evtRes.ok)  setEvents(await evtRes.json());
        if (newsRes.ok) setDepartmentNews(await newsRes.json());
      } catch (err) { console.error(err); }
      finally { setIsLoadingHome(false); }
    };
    fetchHomeData();
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
                <div key={post.id}
                  onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                  className={`flex gap-4 px-5 py-4 cursor-pointer transition-colors ${
                    selectedPost?.id === post.id
                      ? darkMode ? "bg-[#1f2e4a]" : "bg-blue-50"
                      : hoverRow
                  }`}>
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
                      <div className={`flex items-center gap-1 text-xs ${textSub}`}><Eye className="w-3 h-3" />{post.views || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Announcements */}
            <div className={`rounded-2xl shadow-sm border ${card} overflow-hidden`}>
              <div className={`px-5 py-4 border-b flex items-center gap-2 ${divider}`}>
                <Zap className="w-4 h-4 text-orange-500" />
                <h2 className={`font-bold ${textMain}`}>Thông báo</h2>
              </div>
              <div className="p-4 space-y-3">
                {isLoadingHome && <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-[#1F4E79] border-t-transparent rounded-full animate-spin" /></div>}
                {!isLoadingHome && announcements.length === 0 && <p className={`text-xs text-center py-2 ${textSub}`}>Chưa có thông báo</p>}
                {announcements.map(ann => {
                  const IconComp = ICON_MAP[ann.icon] || Bell;
                  return (
                    <div key={ann.id} className={`rounded-xl p-3 cursor-pointer transition-colors ${hoverRow}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ann.color} flex items-center justify-center flex-shrink-0`}>
                          <IconComp className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold leading-snug ${textMain}`}>{ann.title}</p>
                          <p className={`text-xs mt-0.5 leading-relaxed ${textSub}`}>{ann.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Online Members */}
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
            {isLoadingHome ? (
              <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#1F4E79] border-t-transparent rounded-full animate-spin" /></div>
            ) : departmentNews.length === 0 ? (
              <div className={`py-10 text-center text-sm ${textSub}`}>Chưa có tin tức</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                {departmentNews.map((news, index) => (
                  <div key={news.id}
                    className={`p-5 cursor-pointer transition-colors ${hoverRow} ${index % 2 === 0 ? `sm:border-r ${divider}` : ""} ${index < 2 ? `border-b ${divider}` : ""}`}>
                    <div className={`w-full h-1 rounded-full bg-gradient-to-r ${news.gradient} mb-3`} />
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${news.deptColor} inline-flex items-center gap-1 mb-2`}>
                      <Tag className="w-2.5 h-2.5" />{news.department}
                    </span>
                    <h3 className={`font-semibold text-sm leading-snug mb-1.5 line-clamp-2 ${textMain}`}>{news.title}</h3>
                    <p className={`text-xs leading-relaxed line-clamp-2 mb-2 ${textSub}`}>{news.summary}</p>
                    <p className={`text-xs ${textSub}`}>{formatNewsDate(news.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className={`rounded-2xl shadow-sm border ${card} overflow-hidden`}>
            <div className={`px-5 py-4 border-b flex items-center gap-2 ${divider}`}>
              <Calendar className="w-4 h-4 text-[#1F4E79]" />
              <h2 className={`font-bold ${textMain}`}>Sự kiện sắp tới</h2>
            </div>
            <div className="p-4 space-y-3">
              {isLoadingHome && <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-[#1F4E79] border-t-transparent rounded-full animate-spin" /></div>}
              {!isLoadingHome && events.length === 0 && <p className={`text-xs text-center py-2 ${textSub}`}>Chưa có sự kiện</p>}
              {events.map(event => {
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

      {/* ── Post Preview Modal ── */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedPost(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${darkMode ? "bg-[#1a2540]" : "bg-white"}`}>

            {/* Color bar */}
            <div className={`h-1.5 bg-gradient-to-r ${POST_COLORS[posts.findIndex(p => p.id === selectedPost.id) % POST_COLORS.length]}`} />

            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${POST_COLORS[posts.findIndex(p => p.id === selectedPost.id) % POST_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm font-bold">{selectedPost.authorName?.charAt(0) || "U"}</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${textMain}`}>{selectedPost.authorName || "Người dùng"}</p>
                  <p className={`text-xs ${textSub}`}>{formatFullDate(selectedPost.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-[#1F4E79]"}`}>
                  {selectedPost.category}
                </span>
                <button onClick={() => setSelectedPost(null)}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4 max-h-72 overflow-y-auto">
              <h2 className={`text-base font-bold mb-3 leading-snug ${textMain}`}>{selectedPost.title}</h2>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${textSub}`}>{selectedPost.content}</p>
            </div>

            {/* Footer */}
            <div className={`px-5 py-3 border-t flex items-center justify-between ${divider}`}>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-1.5 text-xs ${textSub}`}>
                  <ThumbsUp className="w-3.5 h-3.5" />{selectedPost.likes} thích
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${textSub}`}>
                  <MessageCircle className="w-3.5 h-3.5" />{selectedPost.comments} bình luận
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${textSub}`}>
                  <Eye className="w-3.5 h-3.5" />{selectedPost.views || 0} lượt xem
                </div>
              </div>
              <button onClick={() => { setSelectedPost(null); navigate("/forum"); }}
                className="flex items-center gap-1.5 text-xs text-[#1F4E79] font-semibold hover:underline">
                Xem trên diễn đàn <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}