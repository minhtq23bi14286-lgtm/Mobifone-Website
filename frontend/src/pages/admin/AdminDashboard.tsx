import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users, Shield, TrendingUp, AlertTriangle,
  CheckCircle, Clock, MessageSquare, HelpCircle, FileText,
  AlertCircle, RefreshCw, X, ChevronDown, Send, Wifi
} from "lucide-react";
import { io, Socket } from "socket.io-client";

interface OutletContext { darkMode: boolean; }

type RequestType = "feedback" | "help" | "report" | "other";
type Priority = "low" | "medium" | "high";
type RequestStatus = "pending" | "reviewing" | "resolved" | "closed";

interface ContactRequest {
  id: number; userId: number; userName: string; userEmail: string;
  type: RequestType; subject: string; priority: Priority;
  content: string; status: RequestStatus;
  adminReply?: string; repliedBy?: string; repliedAt?: string; createdAt: string;
}
interface RequestStats { total: number; pending: number; reviewing: number; resolved: number; }

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  onlineCount: number;
  securityAlerts: { type: string; msg: string; time: string }[];
}

const TYPE_MAP: Record<RequestType, { label: string; icon: any; color: string }> = {
  feedback: { label: "Phản hồi",  icon: MessageSquare, color: "from-blue-500 to-[#1F4E79]" },
  help:     { label: "Trợ giúp",  icon: HelpCircle,    color: "from-emerald-500 to-teal-600" },
  report:   { label: "Báo cáo",   icon: AlertCircle,   color: "from-orange-500 to-red-500" },
  other:    { label: "Khác",      icon: FileText,      color: "from-purple-500 to-violet-600" },
};
const PRIORITY_MAP: Record<Priority, { label: string; color: string }> = {
  low:    { label: "Thấp",       color: "bg-green-50 text-green-600 border-green-200" },
  medium: { label: "Trung bình", color: "bg-orange-50 text-orange-500 border-orange-200" },
  high:   { label: "Cao",        color: "bg-red-50 text-red-600 border-red-200" },
};
const STATUS_MAP: Record<RequestStatus, { label: string; color: string; icon: any }> = {
  pending:   { label: "Chờ xử lý",     color: "bg-yellow-50 text-yellow-600 border-yellow-200", icon: Clock },
  reviewing: { label: "Đang xem",      color: "bg-blue-50 text-blue-600 border-blue-200",       icon: RefreshCw },
  resolved:  { label: "Đã giải quyết", color: "bg-green-50 text-green-600 border-green-200",    icon: CheckCircle },
  closed:    { label: "Đã đóng",       color: "bg-gray-100 text-gray-500 border-gray-200",      icon: X },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const recentUsers = [
  { name: "Nguyễn Văn A", email: "nguyen.van.a@mobifone.vn", role: "Employee", status: "online",  joined: "15/04/2026" },
  { name: "Trần Thị B",   email: "tran.thi.b@mobifone.vn",   role: "Manager",  status: "online",  joined: "14/04/2026" },
  { name: "Lê Văn C",     email: "le.van.c@mobifone.vn",     role: "Employee", status: "offline", joined: "13/04/2026" },
  { name: "Phạm Thị D",   email: "pham.thi.d@mobifone.vn",   role: "Employee", status: "offline", joined: "12/04/2026" },
];

export default function AdminDashboard() {
  const { darkMode } = useOutletContext<OutletContext>();

  // Stats state
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, activeUsers: 0, onlineCount: 0, securityAlerts: [],
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [reqStats, setReqStats] = useState<RequestStats>({ total: 0, pending: 0, reviewing: 0, resolved: 0 });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedReq, setSelectedReq] = useState<ContactRequest | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = sessionStorage.getItem("accessToken");

  // ── Fetch stats ───────────────────────────────────────────────────────────
  const fetchStats = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStats(await res.json());
        setLastUpdated(new Date());
      }
    } catch (e) { console.error(e); }
    finally { if (!silent) setIsRefreshing(false); }
  };

  // ── Fetch requests ────────────────────────────────────────────────────────
  const fetchRequests = async () => {
    try {
      const [reqRes, statsRes] = await Promise.all([
        fetch("/api/contact-requests", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/contact-requests/stats", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (reqRes.ok) setRequests(await reqRes.json());
      if (statsRes.ok) setReqStats(await statsRes.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
    fetchRequests();

    // Auto-refresh stats mỗi 30 giây
    refreshInterval.current = setInterval(() => fetchStats(true), 30000);

    // Socket để real-time online count
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token },
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("userOnline", () => {
      setStats(prev => ({ ...prev, onlineCount: prev.onlineCount + 1 }));
    });
    socket.on("userOffline", () => {
      setStats(prev => ({ ...prev, onlineCount: Math.max(0, prev.onlineCount - 1) }));
    });

    return () => {
      socket.disconnect();
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  // ── Request handlers ──────────────────────────────────────────────────────
  const handleUpdateStatus = async (id: number, status: RequestStatus) => {
    try {
      await fetch(`/api/contact-requests/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchRequests();
      if (selectedReq?.id === id) setSelectedReq(prev => prev ? { ...prev, status } : null);
    } catch (e) { console.error(e); }
  };

  const handleReply = async () => {
    if (!selectedReq || !replyText.trim()) return;
    setIsReplying(true);
    try {
      await fetch(`/api/contact-requests/${selectedReq.id}/reply`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: replyText }),
      });
      setReplyText(""); setSelectedReq(null);
      fetchRequests();
    } catch (e) { console.error(e); }
    finally { setIsReplying(false); }
  };

  const filteredRequests = requests.filter(r => filterStatus === "all" || r.status === filterStatus);

  // Theme
  const bg = darkMode ? "bg-[#0f1117]" : "bg-gray-100";
  const card = darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200";
  const title = darkMode ? "text-white" : "text-gray-800";
  const sub = darkMode ? "text-gray-500" : "text-gray-500";
  const alertText = darkMode ? "text-gray-300" : "text-gray-600";
  const alertTime = darkMode ? "text-gray-600" : "text-gray-400";
  const alertRow = darkMode ? "bg-white/5 hover:bg-white/10" : "bg-gray-50 hover:bg-gray-100";
  const tableHeader = darkMode ? "border-white/5 text-gray-500" : "border-gray-200 text-gray-500";
  const tableRow = darkMode ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50";
  const userName = darkMode ? "text-white" : "text-gray-800";
  const userEmail = darkMode ? "text-gray-500" : "text-gray-500";
  const inputBg = darkMode ? "bg-[#0f1117] border-white/10 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400";
  const hoverBg = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const divider = darkMode ? "border-white/5" : "border-gray-100";

  // Stats cards — real data
  const statCards = [
    {
      label: "Tổng người dùng",
      value: stats.totalUsers.toLocaleString(),
      sub: `${stats.activeUsers} đang active`,
      icon: Users,
      bg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      dot: "bg-blue-400",
    },
    {
      label: "Đang online",
      value: stats.onlineCount.toString(),
      sub: "Cập nhật real-time",
      icon: TrendingUp,
      bg: "bg-green-500/10",
      iconColor: "text-green-400",
      dot: "bg-green-400",
      pulse: true,
    },
    {
      label: "Cảnh báo bảo mật",
      value: stats.securityAlerts.filter(a => a.type === "warning" || a.type === "error").length.toString(),
      sub: "Cần xem xét",
      icon: Shield,
      bg: "bg-red-500/10",
      iconColor: "text-red-400",
      dot: "bg-red-400",
    },
  ];

  return (
    <div className={`p-6 space-y-6 min-h-full transition-colors ${bg}`}>

      {/* Header với last updated */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Wifi className="w-3 h-3 text-green-400" />
              Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          )}
          <button onClick={() => fetchStats()} disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${inputBg} ${hoverBg}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#1F4E79]" : "text-gray-400"}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats — 3 cards real-time */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className={`rounded-2xl p-5 border ${card}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${stat.dot} ${stat.pulse ? "animate-pulse" : ""}`} />
                <span className="text-xs text-gray-400">Live</span>
              </div>
            </div>
            <p className={`text-2xl font-bold ${title}`}>{stat.value}</p>
            <p className={`text-sm mt-1 ${sub}`}>{stat.label}</p>
            <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Cảnh báo bảo mật */}
        <div className={`col-span-1 rounded-2xl p-5 border ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-bold ${title}`}>Cảnh báo bảo mật</h2>
            <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded-full">
              {stats.securityAlerts.filter(a => a.type === "warning" || a.type === "error").length} mới
            </span>
          </div>
          <div className="space-y-3">
            {stats.securityAlerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${alertRow}`}>
                <div className="mt-0.5 flex-shrink-0">
                  {alert.type === "warning" && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                  {alert.type === "error"   && <AlertTriangle className="w-4 h-4 text-red-400" />}
                  {alert.type === "info"    && <Clock className="w-4 h-4 text-blue-400" />}
                  {alert.type === "success" && <CheckCircle className="w-4 h-4 text-green-400" />}
                </div>
                <div>
                  <p className={`text-xs leading-relaxed ${alertText}`}>{alert.msg}</p>
                  <p className={`text-xs mt-1 ${alertTime}`}>{alert.time}</p>
                </div>
              </div>
            ))}
            {stats.securityAlerts.length === 0 && (
              <p className={`text-xs text-center py-4 ${sub}`}>Không có cảnh báo nào</p>
            )}
          </div>
        </div>

        {/* Người dùng gần đây */}
        <div className={`col-span-2 rounded-2xl p-5 border ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-bold ${title}`}>Người dùng gần đây</h2>
            <button className="text-xs text-[#2E75B6] hover:text-blue-400 transition-colors">Xem tất cả →</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className={`text-xs border-b ${tableHeader}`}>
                <th className="text-left pb-3">Người dùng</th>
                <th className="text-left pb-3">Vai trò</th>
                <th className="text-left pb-3">Trạng thái</th>
                <th className="text-left pb-3">Ngày tham gia</th>
                <th className="text-left pb-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user, i) => (
                <tr key={i} className={`border-b transition-colors ${tableRow}`}>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${userName}`}>{user.name}</p>
                        <p className={`text-xs ${userEmail}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.role === "Manager" ? "bg-purple-400/10 text-purple-400" : "bg-blue-400/10 text-blue-400"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${user.status === "online" ? "bg-green-400" : "bg-gray-400"}`} />
                      <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{user.status === "online" ? "Online" : "Offline"}</span>
                    </div>
                  </td>
                  <td className="py-3"><span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{user.joined}</span></td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-blue-400 hover:text-blue-300">Sửa</button>
                      <button className="text-xs text-red-400 hover:text-red-300">Khóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requests Section */}
      <div className={`rounded-2xl border ${card}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
          <div className="flex items-center gap-3">
            <h2 className={`font-bold ${title}`}>Yêu cầu từ nhân viên</h2>
            {reqStats.pending > 0 && (
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{reqStats.pending} mới</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "Chờ xử lý", value: reqStats.pending, color: "text-yellow-500" },
              { label: "Đang xem",  value: reqStats.reviewing, color: "text-blue-500" },
              { label: "Đã giải quyết", value: reqStats.resolved, color: "text-green-500" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className={`text-[10px] ${sub}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className={`flex items-center gap-1 px-5 py-3 border-b ${divider}`}>
          {[
            { value: "all",       label: `Tất cả (${reqStats.total})` },
            { value: "pending",   label: "Chờ xử lý" },
            { value: "reviewing", label: "Đang xem" },
            { value: "resolved",  label: "Đã giải quyết" },
            { value: "closed",    label: "Đã đóng" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === f.value ? "bg-[#1F4E79] text-white" : `${sub} ${hoverBg}`}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className={`divide-y ${divider}`}>
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${darkMode ? "text-gray-700" : "text-gray-300"}`} />
              <p className={`text-sm ${sub}`}>Không có yêu cầu nào</p>
            </div>
          )}
          {filteredRequests.map(req => {
            const type = TYPE_MAP[req.type];
            const priority = PRIORITY_MAP[req.priority];
            const status = STATUS_MAP[req.status];
            const StatusIcon = status.icon;
            const TypeIcon = type.icon;
            const isSelected = selectedReq?.id === req.id;
            return (
              <div key={req.id}>
                <div className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors ${hoverBg} ${isSelected ? darkMode ? "bg-white/5" : "bg-blue-50" : ""}`}
                  onClick={() => { setSelectedReq(isSelected ? null : req); setReplyText(""); }}>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <TypeIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priority.color}`}>{priority.label}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />{status.label}
                      </span>
                    </div>
                    <p className={`font-semibold text-sm ${title}`}>{req.subject}</p>
                    <p className={`text-xs mt-0.5 ${sub}`}>{req.userName} • {req.userEmail}</p>
                    <p className={`text-xs mt-0.5 line-clamp-1 ${sub}`}>{req.content}</p>
                    <p className={`text-[10px] mt-1 ${sub}`}>{formatDate(req.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <select value={req.status} onChange={e => handleUpdateStatus(req.id, e.target.value as RequestStatus)}
                      className={`text-xs rounded-lg px-2 py-1.5 border focus:outline-none cursor-pointer ${inputBg}`}>
                      <option value="pending">Chờ xử lý</option>
                      <option value="reviewing">Đang xem</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="closed">Đã đóng</option>
                    </select>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSelected ? "rotate-180" : ""} ${sub}`} />
                  </div>
                </div>

                {isSelected && (
                  <div className={`px-5 pb-5 space-y-3 ${darkMode ? "bg-white/3" : "bg-gray-50"}`}>
                    <div className={`p-4 rounded-xl border ${darkMode ? "bg-[#0f1117] border-white/5" : "bg-white border-gray-200"}`}>
                      <p className={`text-xs font-semibold mb-1 ${sub}`}>Nội dung đầy đủ:</p>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${title}`}>{req.content}</p>
                    </div>
                    {req.adminReply && (
                      <div className={`p-4 rounded-xl border-l-2 border-[#1F4E79] ${darkMode ? "bg-white/5" : "bg-blue-50"}`}>
                        <p className="text-xs font-bold text-[#1F4E79] mb-1">Phản hồi của {req.repliedBy}:</p>
                        <p className={`text-sm ${sub}`}>{req.adminReply}</p>
                      </div>
                    )}
                    {req.status !== "closed" && (
                      <div className="space-y-2">
                        <textarea placeholder="Nhập phản hồi cho nhân viên..." value={replyText}
                          onChange={e => setReplyText(e.target.value)} rows={3}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] resize-none ${inputBg}`} />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setSelectedReq(null); setReplyText(""); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${darkMode ? "border-white/10 text-gray-400" : "border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                            Hủy
                          </button>
                          <button onClick={handleReply} disabled={!replyText.trim() || isReplying}
                            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
                            {isReplying
                              ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Đang gửi...</>
                              : <><Send className="w-3 h-3" />Gửi phản hồi</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
