import { useState, useEffect } from "react";
import {
  Send, Trash2, AlertCircle, HelpCircle, MessageSquare,
  CheckCircle, Clock, FileText, X, RefreshCw
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

type RequestType = "feedback" | "help" | "report" | "other";
type Priority = "low" | "medium" | "high";
type RequestStatus = "pending" | "reviewing" | "resolved" | "closed";

interface ContactForm { type: RequestType; subject: string; priority: Priority; content: string; }
interface ContactRequest {
  id: number; type: RequestType; subject: string; priority: Priority; content: string;
  status: RequestStatus; adminReply?: string; repliedBy?: string; repliedAt?: string; createdAt: string;
}

const REQUEST_TYPES: { value: RequestType; label: string; icon: any; desc: string; color: string }[] = [
  { value: "feedback", label: "Phản hồi",  icon: MessageSquare, desc: "Ý kiến đóng góp",     color: "from-blue-500 to-[#1F4E79]" },
  { value: "help",     label: "Trợ giúp",  icon: HelpCircle,    desc: "Cần hỗ trợ kỹ thuật", color: "from-emerald-500 to-teal-600" },
  { value: "report",   label: "Báo cáo",   icon: AlertCircle,   desc: "Báo lỗi hoặc vấn đề", color: "from-orange-500 to-red-500" },
  { value: "other",    label: "Khác",      icon: FileText,      desc: "Nội dung khác",        color: "from-purple-500 to-violet-600" },
];

const PRIORITIES: { value: Priority; label: string; color: string; bg: string }[] = [
  { value: "low",    label: "Thấp",       color: "text-green-600",  bg: "bg-green-50 border-green-200" },
  { value: "medium", label: "Trung bình", color: "text-orange-500", bg: "bg-orange-50 border-orange-200" },
  { value: "high",   label: "Cao",        color: "text-red-600",    bg: "bg-red-50 border-red-200" },
];

const STATUS_MAP: Record<RequestStatus, { label: string; color: string; icon: any }> = {
  pending:   { label: "Chờ xử lý",     color: "bg-yellow-50 text-yellow-600 border-yellow-200", icon: Clock },
  reviewing: { label: "Đang xem",      color: "bg-blue-50 text-blue-600 border-blue-200",       icon: RefreshCw },
  resolved:  { label: "Đã giải quyết", color: "bg-green-50 text-green-600 border-green-200",    icon: CheckCircle },
  closed:    { label: "Đã đóng",       color: "bg-gray-100 text-gray-500 border-gray-200",      icon: X },
};

const SUBJECT_SUGGESTIONS: Record<RequestType, string[]> = {
  feedback: ["Góp ý về giao diện", "Đề xuất tính năng mới", "Nhận xét về hiệu suất"],
  help:     ["Không thể đăng nhập", "Lỗi khi gửi tin nhắn", "Không nhận được thông báo"],
  report:   ["Lỗi hiển thị trang", "Dữ liệu không chính xác", "Tính năng không hoạt động"],
  other:    ["Yêu cầu cấp quyền", "Câu hỏi về chính sách", "Liên hệ quản trị viên"],
};

const EMPTY_FORM: ContactForm = { type: "feedback", subject: "", priority: "medium", content: "" };

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function Contact() {
  const { darkMode } = useThemeStore();
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");

  const fetchRequests = async () => {
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch("/api/contact-requests/my", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      setRequests(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const validate = () => {
    const e: Partial<ContactForm> = {};
    if (!form.subject.trim()) e.subject = "Vui lòng nhập tiêu đề";
    if (!form.content.trim()) e.content = "Vui lòng nhập nội dung";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("accessToken");
      const res = await fetch("/api/contact-requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setForm(EMPTY_FORM);
      setShowSuccess("Yêu cầu đã được gửi đến quản trị viên!");
      setTimeout(() => setShowSuccess(null), 3000);
      fetchRequests();
    } catch { setShowSuccess("Lỗi gửi yêu cầu. Vui lòng thử lại!"); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa yêu cầu này?")) return;
    try {
      const token = sessionStorage.getItem("accessToken");
      await fetch(`/api/contact-requests/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      fetchRequests();
    } catch (err) { console.error(err); }
  };

  const handleClear = () => {
    if (form.subject || form.content) if (!confirm("Bạn có chắc muốn xóa nội dung đang soạn?")) return;
    setForm(EMPTY_FORM); setErrors({});
  };

  const selectedType = REQUEST_TYPES.find(t => t.value === form.type)!;
  const selectedPriority = PRIORITIES.find(p => p.value === form.priority)!;

  const bg = darkMode ? "bg-[#131929]" : "bg-gray-50";
  const card = darkMode ? "bg-[#1a2540] border-[#2a3a5c]" : "bg-white border-gray-100";
  const inputBg = darkMode ? "bg-[#131929] border-[#2a3a5c] text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400";
  const textMain = darkMode ? "text-white" : "text-gray-800";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const divider = darkMode ? "border-[#2a3a5c]" : "border-gray-100";
  const hoverBg = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";

  return (
    <div className={`h-full flex flex-col overflow-y-auto ${bg}`}>
      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 space-y-5 md:space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-xl md:text-2xl font-bold ${textMain}`}>Liên hệ & Hỗ trợ</h1>
            <p className={`text-sm mt-1 ${textSub}`}>Gửi phản hồi, báo lỗi hoặc yêu cầu hỗ trợ đến quản trị viên</p>
          </div>
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${card} self-start sm:self-auto`}>
            {[
              { value: "form", label: "Soạn yêu cầu" },
              { value: "history", label: `Lịch sử (${requests.length})` },
            ].map(tab => (
              <button key={tab.value} onClick={() => setActiveTab(tab.value as any)}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.value ? "bg-[#1F4E79] text-white shadow-sm" : `${textSub} ${hoverBg}`}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toast */}
        {showSuccess && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${showSuccess.includes("Lỗi") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{showSuccess}</p>
          </div>
        )}

        {/* Form Tab */}
        {activeTab === "form" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
            <div className={`lg:col-span-2 rounded-2xl border p-4 md:p-6 space-y-5 ${card}`}>

              {/* Loại */}
              <div>
                <label className={`block text-sm font-semibold mb-3 ${textMain}`}>Loại yêu cầu</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REQUEST_TYPES.map(type => (
                    <button key={type.value} onClick={() => setForm(f => ({ ...f, type: type.value }))}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${form.type === type.value ? "border-[#1F4E79] bg-blue-50" : darkMode ? "border-[#2a3a5c] hover:border-[#3a4a6c]" : "border-gray-100 hover:border-gray-200"}`}>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                        <type.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className={`text-xs font-semibold ${form.type === type.value ? "text-[#1F4E79]" : textSub}`}>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiêu đề */}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textMain}`}>Tiêu đề *</label>
                <div className="relative">
                  <input type="text" placeholder="Nhập tiêu đề ngắn gọn..." value={form.subject}
                    onChange={e => { setForm(f => ({ ...f, subject: e.target.value })); setErrors(e2 => ({ ...e2, subject: undefined })); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${inputBg} ${errors.subject ? "border-red-400" : ""}`} />
                  {showSuggestions && (
                    <div className={`absolute top-full mt-1 w-full rounded-xl border shadow-lg z-10 overflow-hidden ${card}`}>
                      {SUBJECT_SUGGESTIONS[form.type].map(s => (
                        <button key={s} onMouseDown={() => setForm(f => ({ ...f, subject: s }))}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${textSub} ${hoverBg}`}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
              </div>

              {/* Ưu tiên */}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textMain}`}>Mức độ ưu tiên</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => (
                    <button key={p.value} onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${form.priority === p.value ? `${p.bg} ${p.color} border-current` : darkMode ? "border-[#2a3a5c] text-gray-400" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>{p.label}</button>
                  ))}
                </div>
              </div>

              {/* Nội dung */}
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textMain}`}>Nội dung *</label>
                <textarea placeholder="Mô tả chi tiết vấn đề hoặc yêu cầu của bạn..." value={form.content}
                  onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setErrors(e2 => ({ ...e2, content: undefined })); }}
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors resize-none ${inputBg} ${errors.content ? "border-red-400" : ""}`} />
                <div className="flex items-center justify-between mt-1">
                  {errors.content ? <p className="text-red-500 text-xs">{errors.content}</p> : <span className={`text-xs ${textSub}`}>Mô tả càng chi tiết, admin sẽ hỗ trợ bạn nhanh hơn</span>}
                  <span className={`text-xs ${textSub}`}>{form.content.length} ký tự</span>
                </div>
              </div>

              {/* Actions */}
              <div className={`flex items-center justify-between pt-4 border-t ${divider}`}>
                <button onClick={handleClear}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${darkMode ? "border-[#2a3a5c] text-gray-400 hover:bg-white/5" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                  <X className="w-4 h-4" /> Xóa bỏ
                </button>
                <button onClick={handleSend} disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-50">
                  {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang gửi...</> : <><Send className="w-4 h-4" /> Gửi ngay</>}
                </button>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-4">
              <div className={`rounded-2xl border p-5 space-y-4 ${card}`}>
                <h3 className={`font-bold text-sm ${textMain}`}>Thông tin người gửi</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{currentUser.displayName?.charAt(0) || "U"}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${textMain}`}>{currentUser.displayName || "Người dùng"}</p>
                    <p className={`text-xs ${textSub}`}>{currentUser.email || ""}</p>
                    <p className={`text-xs ${textSub}`}>{currentUser.role || "Employee"}</p>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl border p-5 space-y-3 ${card}`}>
                <h3 className={`font-bold text-sm ${textMain}`}>Xem trước</h3>
                <div className={`flex items-center gap-2 p-2.5 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${selectedType.color} flex items-center justify-center flex-shrink-0`}>
                    <selectedType.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className={`text-xs font-medium ${textMain}`}>{selectedType.label}</span>
                  <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full border ${selectedPriority.bg} ${selectedPriority.color}`}>{selectedPriority.label}</span>
                </div>
                {form.subject && <p className={`text-sm font-semibold ${textMain}`}>{form.subject}</p>}
                {form.content && <p className={`text-xs leading-relaxed line-clamp-4 ${textSub}`}>{form.content}</p>}
                {!form.subject && !form.content && <p className={`text-xs ${textSub}`}>Nội dung sẽ hiện ở đây...</p>}
              </div>

              <div className={`rounded-2xl border p-5 space-y-2 ${card}`}>
                <h3 className={`font-bold text-sm ${textMain}`}>Gợi ý</h3>
                {["Mô tả vấn đề càng rõ ràng càng tốt","Nêu các bước đã thực hiện trước đó","Admin sẽ phản hồi trong vòng 24 giờ","Chọn mức ưu tiên phù hợp với tình huống"].map((tip, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs ${textSub}`}>
                    <span className="text-[#1F4E79] font-bold flex-shrink-0">{i + 1}.</span>{tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="text-center py-16">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${darkMode ? "bg-white/5" : "bg-gray-100"}`}>
                  <FileText className={`w-8 h-8 ${darkMode ? "text-gray-600" : "text-gray-300"}`} />
                </div>
                <p className={`font-semibold ${textMain}`}>Chưa có yêu cầu nào</p>
                <p className={`text-sm mt-1 ${textSub}`}>Các yêu cầu bạn gửi sẽ xuất hiện ở đây</p>
                <button onClick={() => setActiveTab("form")}
                  className="mt-4 px-5 py-2 bg-[#1F4E79] text-white text-sm font-semibold rounded-xl hover:bg-[#2E75B6] transition-colors">
                  Soạn yêu cầu mới
                </button>
              </div>
            )}
            {requests.map(req => {
              const type = REQUEST_TYPES.find(t => t.value === req.type)!;
              const priority = PRIORITIES.find(p => p.value === req.priority)!;
              const status = STATUS_MAP[req.status];
              const StatusIcon = status.icon;
              return (
                <div key={req.id} className={`rounded-2xl border p-4 md:p-5 transition-all hover:shadow-md ${card}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <type.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priority.bg} ${priority.color}`}>{priority.label}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-2.5 h-2.5" />{status.label}
                          </span>
                        </div>
                        <p className={`font-semibold text-sm ${textMain}`}>{req.subject}</p>
                        <p className={`text-xs leading-relaxed line-clamp-2 mt-1 ${textSub}`}>{req.content}</p>
                        {req.adminReply && (
                          <div className={`mt-2 p-2.5 rounded-xl border-l-2 border-[#1F4E79] ${darkMode ? "bg-white/5" : "bg-blue-50"}`}>
                            <p className="text-[10px] font-bold text-[#1F4E79] mb-0.5">Phản hồi từ {req.repliedBy}:</p>
                            <p className={`text-xs ${textSub}`}>{req.adminReply}</p>
                          </div>
                        )}
                        <p className={`text-[10px] mt-2 ${textSub}`}>Gửi lúc {formatDate(req.createdAt)}</p>
                      </div>
                    </div>
                    {req.status === "pending" && (
                      <button onClick={() => handleDelete(req.id)}
                        className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}