import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
   AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Globe, Monitor, ChevronDown, ChevronUp,
  Lock, TrendingUp, TrendingDown, Wifi
} from "lucide-react";

interface OutletContext { darkMode: boolean; }

interface LoginHistory {
  id: number;
  userId?: number;
  email: string;
  status: "success" | "failed" | "blocked";
  ipAddress?: string;
  userAgent?: string;
  failReason?: string;
  createdAt: string;
}

interface SuspectIP {
  ip: string;
  failCount: string;
  lastAttempt: string;
}

interface SecurityStats {
  totalLogins: number;
  successToday: number;
  failedToday: number;
  failedWeek: number;
  suspectIPCount: number;
  suspectIPs: SuspectIP[];
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

const parseUserAgent = (ua?: string) => {
  if (!ua) return "Không rõ";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return ua.substring(0, 30) + "...";
};

const parseOS = (ua?: string) => {
  if (!ua) return "";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS")) return "iOS";
  return "";
};

export default function AdminSecurity() {
  const { darkMode } = useOutletContext<OutletContext>();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [history, setHistory] = useState<LoginHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEmail, setFilterEmail] = useState("");
  const [showSuspectIPs, setShowSuspectIPs] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [limit, setLimit] = useState(50);

  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch("/api/security/stats", { headers }),
        fetch(`/api/security/history?limit=${limit}`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
      setLastUpdated(new Date());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); if (!silent) setIsRefreshing(false); }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [limit]);

  const filtered = history.filter(h => {
    const matchStatus = filterStatus === "all" || h.status === filterStatus;
    const matchEmail = !filterEmail || h.email.toLowerCase().includes(filterEmail.toLowerCase());
    return matchStatus && matchEmail;
  });

  // Theme
  const bg = darkMode ? "bg-[#0f1117]" : "bg-gray-100";
  const card = darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200";
  const textMain = darkMode ? "text-white" : "text-gray-800";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBg = darkMode ? "bg-[#0f1117] border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-800 placeholder-gray-400";
  const tableHeader = darkMode ? "border-white/5 text-gray-500" : "border-gray-200 text-gray-500";
  const tableRow = darkMode ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50";
  const hoverBg = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const divider = darkMode ? "border-white/5" : "border-gray-100";

  const statusBadge = (status: string) => {
    switch (status) {
      case "success": return "bg-green-50 text-green-600 border-green-200";
      case "failed":  return "bg-red-50 text-red-600 border-red-200";
      case "blocked": return "bg-orange-50 text-orange-600 border-orange-200";
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };
  const statusLabel = (status: string) => {
    switch (status) {
      case "success": return "Thành công";
      case "failed":  return "Thất bại";
      case "blocked": return "Bị chặn";
      default: return status;
    }
  };
  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-3 h-3" />;
      case "failed":  return <XCircle className="w-3 h-3" />;
      case "blocked": return <Lock className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className={`p-6 space-y-5 h-full overflow-y-auto ${bg}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${textMain}`}>Bảo mật & Giám sát</h1>
          <p className={`text-sm mt-0.5 ${textSub}`}>Theo dõi hoạt động đăng nhập và phát hiện mối đe dọa</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Wifi className="w-3 h-3 text-green-400" />
              {lastUpdated.toLocaleTimeString("vi-VN")}
            </div>
          )}
          <button onClick={() => fetchData()} disabled={isRefreshing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${inputBg} ${hoverBg}`}>
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#1F4E79]" : "text-gray-400"}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Đăng nhập hôm nay", value: stats?.successToday ?? 0, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", trend: "up" },
          { label: "Thất bại hôm nay",  value: stats?.failedToday ?? 0,  icon: XCircle,     color: "text-red-500",   bg: "bg-red-500/10",   trend: stats?.failedToday ? "down" : "up" },
          { label: "Thất bại 7 ngày",   value: stats?.failedWeek ?? 0,   icon: AlertTriangle,color: "text-orange-500",bg: "bg-orange-500/10",trend: "down" },
          { label: "IP đáng ngờ",       value: stats?.suspectIPCount ?? 0,icon: Globe,       color: "text-purple-500",bg: "bg-purple-500/10",trend: "down" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              {s.trend === "up"
                ? <TrendingUp className="w-4 h-4 text-green-400" />
                : <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
            <p className={`text-2xl font-bold ${textMain}`}>{s.value}</p>
            <p className={`text-xs mt-1 ${textSub}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Suspect IPs */}
      {stats && stats.suspectIPs.length > 0 && (
        <div className={`rounded-2xl border ${card}`}>
          <button
            onClick={() => setShowSuspectIPs(v => !v)}
            className={`w-full flex items-center justify-between px-5 py-4 ${hoverBg} transition-colors rounded-2xl`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-left">
                <p className={`font-bold text-sm ${textMain}`}>IP đáng ngờ</p>
                <p className={`text-xs ${textSub}`}>{stats.suspectIPs.length} IP có nhiều lần đăng nhập thất bại trong 24 giờ</p>
              </div>
            </div>
            {showSuspectIPs ? <ChevronUp className={`w-4 h-4 ${textSub}`} /> : <ChevronDown className={`w-4 h-4 ${textSub}`} />}
          </button>
          {showSuspectIPs && (
            <div className={`border-t ${divider}`}>
              <table className="w-full">
                <thead>
                  <tr className={`text-xs border-b ${tableHeader}`}>
                    <th className="text-left px-5 py-3">Địa chỉ IP</th>
                    <th className="text-left px-5 py-3">Số lần thất bại</th>
                    <th className="text-left px-5 py-3">Lần cuối</th>
                    <th className="text-left px-5 py-3">Mức độ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.suspectIPs.map((ip, i) => {
                    const count = parseInt(ip.failCount);
                    const level = count >= 10 ? { label: "Nguy hiểm", color: "bg-red-50 text-red-600 border-red-200" }
                      : count >= 5 ? { label: "Cảnh báo", color: "bg-orange-50 text-orange-600 border-orange-200" }
                      : { label: "Theo dõi", color: "bg-yellow-50 text-yellow-600 border-yellow-200" };
                    return (
                      <tr key={i} className={`border-b transition-colors ${tableRow}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Globe className={`w-3.5 h-3.5 ${textSub}`} />
                            <span className={`text-sm font-mono font-medium ${textMain}`}>{ip.ip}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-sm font-bold text-red-500`}>{ip.failCount} lần</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs ${textSub}`}>{formatDate(ip.lastAttempt)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${level.color}`}>{level.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Login History */}
      <div className={`rounded-2xl border ${card}`}>
        {/* Header */}
        <div className={`px-5 py-4 border-b ${divider} flex items-center justify-between flex-wrap gap-3`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className={`font-bold text-sm ${textMain}`}>Lịch sử đăng nhập</p>
              <p className={`text-xs ${textSub}`}>{filtered.length} bản ghi</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter email */}
            <input type="text" placeholder="Lọc theo email..." value={filterEmail}
              onChange={e => setFilterEmail(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:border-[#1F4E79] w-48 ${inputBg}`} />
            {/* Filter status */}
            <div className={`flex items-center gap-1 p-1 rounded-lg ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>
              {[
                { value: "all",     label: "Tất cả" },
                { value: "success", label: "Thành công" },
                { value: "failed",  label: "Thất bại" },
                { value: "blocked", label: "Bị chặn" },
              ].map(f => (
                <button key={f.value} onClick={() => setFilterStatus(f.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === f.value ? "bg-[#1F4E79] text-white" : `${textSub} ${hoverBg}`}`}>
                  {f.label}
                </button>
              ))}
            </div>
            {/* Limit */}
            <select value={limit} onChange={e => setLimit(Number(e.target.value))}
              className={`px-2 py-1.5 rounded-lg border text-xs focus:outline-none ${inputBg}`}>
              <option value={50}>50 bản ghi</option>
              <option value={100}>100 bản ghi</option>
              <option value={200}>200 bản ghi</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-[#1F4E79] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`text-xs border-b ${tableHeader}`}>
                  <th className="text-left px-5 py-3">Trạng thái</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Địa chỉ IP</th>
                  <th className="text-left px-5 py-3">Trình duyệt / OS</th>
                  <th className="text-left px-5 py-3">Lý do thất bại</th>
                  <th className="text-left px-5 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className={`text-center py-12 text-sm ${textSub}`}>Không có dữ liệu</td></tr>
                )}
                {filtered.map(log => (
                  <tr key={log.id} className={`border-b transition-colors ${tableRow}`}>
                    <td className="px-5 py-3">
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border w-fit ${statusBadge(log.status)}`}>
                        {statusIcon(log.status)}{statusLabel(log.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${
                          log.status === "success" ? "bg-gradient-to-br from-[#1F4E79] to-[#2E75B6]" : "bg-gray-400"
                        }`}>
                          {log.email.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-xs font-medium ${textMain}`}>{log.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-mono ${textSub}`}>{log.ipAddress || "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className={`text-xs ${textSub}`}>
                        <span className="font-medium">{parseUserAgent(log.userAgent)}</span>
                        {parseOS(log.userAgent) && <span className="ml-1 text-gray-400">· {parseOS(log.userAgent)}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {log.failReason
                        ? <span className="text-xs text-red-500">{log.failReason}</span>
                        : <span className={`text-xs ${textSub}`}>—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs ${textSub}`}>{formatDate(log.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
