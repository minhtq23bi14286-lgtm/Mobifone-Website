import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FileText, CheckCircle, XCircle, Clock, Trash2,
  RefreshCw, Search, ChevronDown, ChevronUp,
User, Calendar, X
} from "lucide-react";

interface OutletContext { darkMode: boolean; }

type PostStatus = "pending" | "approved" | "rejected";

interface Post {
  id: number;
  userId: number;
  title: string;
  content: string;
  category: string;
  attachments: string[];
  likes: number;
  comments: number;
  views: number;
  status: PostStatus;
  rejectReason?: string;
  reviewedAt?: string;
  createdAt: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
}

interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const STATUS_MAP: Record<PostStatus, { label: string; color: string; icon: any }> = {
  pending:  { label: "Chờ duyệt",  color: "bg-yellow-50 text-yellow-600 border-yellow-200", icon: Clock },
  approved: { label: "Đã duyệt",   color: "bg-green-50 text-green-600 border-green-200",   icon: CheckCircle },
  rejected: { label: "Từ chối",    color: "bg-red-50 text-red-600 border-red-200",          icon: XCircle },
};

const CATEGORIES = ["Tất cả", "Công nghệ", "Marketing", "HR", "Kinh doanh", "Chuyển đổi số", "Khác"];

const REJECT_REASONS = [
  "Ngôn ngữ không phù hợp",
  "Nội dung vi phạm quy định công ty",
  "Thông tin sai lệch hoặc không chính xác",
  "Nội dung nhạy cảm về chính trị/tư tưởng",
  "Spam hoặc quảng cáo không phép",
  "Nội dung không liên quan đến công việc",
  "Vi phạm bảo mật thông tin",
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminContent() {
  const { darkMode } = useOutletContext<OutletContext>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<ModerationStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterCategory, setFilterCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState<Post | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const token = sessionStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [postsRes, statsRes] = await Promise.all([
        fetch(`/api/posts/admin/all${filterStatus !== "all" ? `?status=${filterStatus}` : ""}`, { headers }),
        fetch("/api/posts/admin/stats", { headers }),
      ]);
      if (postsRes.ok) setPosts(await postsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); if (!silent) setIsRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, [filterStatus]);

  const handleApprove = async (post: Post) => {
    try {
      const res = await fetch(`/api/posts/admin/${post.id}/approve`, { method: "PATCH", headers });
      if (res.ok) {
        showToast(`✅ Đã duyệt bài "${post.title}"`);
        fetchData(true);
        setExpandedPost(null);
      }
    } catch { showToast("Lỗi duyệt bài", "error"); }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    const reason = rejectReason === "custom" ? customReason : rejectReason;
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/admin/${showRejectModal.id}/reject`, {
        method: "PATCH", headers,
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        showToast(`❌ Đã từ chối bài "${showRejectModal.title}"`);
        setShowRejectModal(null); setRejectReason(""); setCustomReason("");
        fetchData(true); setExpandedPost(null);
      }
    } catch { showToast("Lỗi từ chối bài", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Xóa vĩnh viễn bài "${post.title}"?`)) return;
    try {
      const res = await fetch(`/api/posts/admin/${post.id}`, { method: "DELETE", headers });
      if (res.ok) { showToast(`🗑️ Đã xóa bài "${post.title}"`); fetchData(true); }
    } catch { showToast("Lỗi xóa bài", "error"); }
  };

  const filtered = posts.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.authorName.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "Tất cả" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  // Theme
  const bg = darkMode ? "bg-[#0f1117]" : "bg-gray-100";
  const card = darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200";
  const textMain = darkMode ? "text-white" : "text-gray-800";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBg = darkMode ? "bg-[#0f1117] border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-800 placeholder-gray-400";
  const hoverBg = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const divider = darkMode ? "border-white/5" : "border-gray-100";
  const modalBg = darkMode ? "bg-[#161b27] border-white/10" : "bg-white border-gray-200";

  return (
    <div className={`p-6 space-y-5 h-full overflow-y-auto ${bg}`}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 max-w-sm ${
          toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${textMain}`}>Quản lý nội dung</h1>
          <p className={`text-sm mt-0.5 ${textSub}`}>Kiểm duyệt bài viết trước khi hiển thị trên forum</p>
        </div>
        <button onClick={() => fetchData()} disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${inputBg} ${hoverBg}`}>
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#1F4E79]" : "text-gray-400"}`} />
          Làm mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng bài viết",  value: stats.total,    color: "text-blue-500",   bg: "bg-blue-500/10",   icon: FileText,     status: "all" },
          { label: "Chờ duyệt",      value: stats.pending,  color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Clock,        status: "pending" },
          { label: "Đã duyệt",       value: stats.approved, color: "text-green-500",  bg: "bg-green-500/10",  icon: CheckCircle,  status: "approved" },
          { label: "Đã từ chối",     value: stats.rejected, color: "text-red-500",    bg: "bg-red-500/10",    icon: XCircle,      status: "rejected" },
        ].map((s, i) => (
          <button key={i} onClick={() => setFilterStatus(s.status)}
            className={`rounded-2xl border p-5 text-left transition-all hover:shadow-md ${card} ${filterStatus === s.status ? "ring-2 ring-[#1F4E79]" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              {s.status === "pending" && stats.pending > 0 && (
                <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">{stats.pending}</span>
              )}
            </div>
            <p className={`text-2xl font-bold ${textMain}`}>{s.value}</p>
            <p className={`text-xs mt-1 ${textSub}`}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className={`rounded-2xl border p-4 flex items-center gap-3 flex-wrap ${card}`}>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm tiêu đề, tác giả, nội dung..." value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${inputBg}`} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${inputBg}`}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <div className={`flex items-center gap-1 p-1 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>
          {[
            { value: "all",      label: "Tất cả" },
            { value: "pending",  label: "Chờ duyệt" },
            { value: "approved", label: "Đã duyệt" },
            { value: "rejected", label: "Từ chối" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === f.value ? "bg-[#1F4E79] text-white" : `${textSub} ${hoverBg}`}`}>
              {f.label}
            </button>
          ))}
        </div>
        <span className={`text-xs ${textSub}`}>{filtered.length} bài</span>
      </div>

      {/* Post list */}
      <div className={`rounded-2xl border overflow-hidden ${card}`}>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-[#1F4E79] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className={`w-12 h-12 mx-auto mb-3 ${darkMode ? "text-gray-700" : "text-gray-300"}`} />
            <p className={`font-semibold ${textMain}`}>Không có bài viết nào</p>
            <p className={`text-sm mt-1 ${textSub}`}>
              {filterStatus === "pending" ? "Tất cả bài viết đã được xử lý!" : "Không tìm thấy kết quả phù hợp"}
            </p>
          </div>
        ) : (
          <div className={`divide-y ${divider}`}>
            {filtered.map(post => {
              const status = STATUS_MAP[post.status];
              const StatusIcon = status.icon;
              const isExpanded = expandedPost === post.id;

              return (
                <div key={post.id}>
                  {/* Row */}
                  <div className={`px-5 py-4 transition-colors ${hoverBg} ${isExpanded ? darkMode ? "bg-white/5" : "bg-blue-50/50" : ""}`}>
                    <div className="flex items-start gap-4">

                      {/* Status icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        post.status === "pending" ? "bg-yellow-500/10" :
                        post.status === "approved" ? "bg-green-500/10" : "bg-red-500/10"
                      }`}>
                        <StatusIcon className={`w-4 h-4 ${
                          post.status === "pending" ? "text-yellow-500" :
                          post.status === "approved" ? "text-green-500" : "text-red-500"
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                            {status.label}
                          </span>
                          {post.category && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-[#1F4E79]"}`}>
                              {post.category}
                            </span>
                          )}
                        </div>
                        <p className={`font-semibold text-sm ${textMain}`}>{post.title}</p>
                        <div className={`flex items-center gap-3 mt-1 text-xs ${textSub}`}>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.authorName}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.createdAt)}</span>
                        </div>
                        {!isExpanded && (
                          <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${textSub}`}>{post.content}</p>
                        )}
                        {post.status === "rejected" && post.rejectReason && (
                          <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs border-l-2 border-red-400 ${darkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}>
                            <span className="font-semibold">Lý do từ chối: </span>{post.rejectReason}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Expand */}
                        <button onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                          className={`p-1.5 rounded-lg transition-colors ${hoverBg} ${textSub}`} title="Xem chi tiết">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {/* Approve */}
                        {post.status !== "approved" && (
                          <button onClick={() => handleApprove(post)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors"
                            title="Duyệt bài">
                            <CheckCircle className="w-3.5 h-3.5" /> Duyệt
                          </button>
                        )}

                        {/* Reject */}
                        {post.status !== "rejected" && (
                          <button onClick={() => { setShowRejectModal(post); setRejectReason(""); setCustomReason(""); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors"
                            title="Từ chối">
                            <XCircle className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        )}

                        {/* Delete */}
                        <button onClick={() => handleDelete(post)}
                          className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title="Xóa vĩnh viễn">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className={`px-5 pb-5 pt-2 space-y-3 border-t ${divider} ${darkMode ? "bg-white/3" : "bg-gray-50"}`}>
                      {/* Author info */}
                      <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-white"} border ${divider}`}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{post.authorName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${textMain}`}>{post.authorName}</p>
                          <p className={`text-xs ${textSub}`}>{post.authorEmail} • {post.authorRole}</p>
                        </div>
                      </div>

                      {/* Full content */}
                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-[#0f1117] border-white/5" : "bg-white border-gray-200"}`}>
                        <p className={`text-xs font-semibold mb-2 ${textSub}`}>Nội dung đầy đủ:</p>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap ${textMain}`}>{post.content}</p>
                      </div>

                      {/* Stats */}
                      <div className={`flex gap-4 py-2 px-4 rounded-xl text-xs ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>
                        {[
                          { label: "Lượt thích", value: post.likes },
                          { label: "Bình luận",  value: post.comments },
                          { label: "Lượt xem",   value: post.views },
                        ].map(s => (
                          <div key={s.label}>
                            <span className={`font-bold ${textMain}`}>{s.value}</span>
                            <span className={` ml-1 ${textSub}`}>{s.label}</span>
                          </div>
                        ))}
                        <div className="ml-auto">
                          <span className={textSub}>Đăng lúc: </span>
                          <span className={`font-medium ${textMain}`}>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Từ chối bài ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg border ${modalBg}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className={`font-bold text-sm ${textMain}`}>Từ chối bài viết</h2>
                  <p className={`text-xs ${textSub} truncate max-w-xs`}>{showRejectModal.title}</p>
                </div>
              </div>
              <button onClick={() => setShowRejectModal(null)} className={`p-1.5 rounded-lg ${hoverBg} ${textSub}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-2 ${textMain}`}>Chọn lý do từ chối *</label>
                <div className="space-y-2">
                  {REJECT_REASONS.map(reason => (
                    <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      rejectReason === reason
                        ? "border-red-400 bg-red-50"
                        : darkMode ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
                    }`}>
                      <input type="radio" name="reason" value={reason}
                        checked={rejectReason === reason}
                        onChange={() => setRejectReason(reason)}
                        className="accent-red-500 flex-shrink-0" />
                      <span className={`text-sm ${rejectReason === reason ? "text-red-600 font-medium" : textSub}`}>{reason}</span>
                    </label>
                  ))}
                  {/* Custom reason */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    rejectReason === "custom"
                      ? "border-red-400 bg-red-50"
                      : darkMode ? "border-white/10 hover:bg-white/5" : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input type="radio" name="reason" value="custom"
                      checked={rejectReason === "custom"}
                      onChange={() => setRejectReason("custom")}
                      className="accent-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className={`text-sm ${rejectReason === "custom" ? "text-red-600 font-medium" : textSub}`}>Lý do khác...</span>
                      {rejectReason === "custom" && (
                        <textarea value={customReason} onChange={e => setCustomReason(e.target.value)}
                          placeholder="Nhập lý do cụ thể..." rows={3}
                          className={`mt-2 w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-red-400 resize-none ${inputBg}`} />
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-2 ${divider}`}>
              <button onClick={() => setShowRejectModal(null)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${inputBg} ${hoverBg}`}>Hủy</button>
              <button onClick={handleReject}
                disabled={!rejectReason || (rejectReason === "custom" && !customReason.trim()) || isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
