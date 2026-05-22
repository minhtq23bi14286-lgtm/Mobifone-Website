import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Megaphone, Calendar, Newspaper, Plus, Trash2, Pencil,
  X, Check, Bell, Clock, Zap,
} from "lucide-react";

interface DarkModeContext { darkMode: boolean; }

interface Announcement {
  id: number; title: string; description: string; icon: string; color: string; isActive: boolean; createdAt: string;
}
interface Event {
  id: number; title: string; date: string; time: string; location: string;
  typeLabel: string; color: string; tagColor: string; isActive: boolean;
}
interface DepartmentNews {
  id: number; title: string; summary: string; department: string;
  deptColor: string; gradient: string; isActive: boolean; createdAt: string;
}

const TABS = [
  { id: "announcements", label: "Thông báo",        icon: Megaphone },
  { id: "events",        label: "Sự kiện",           icon: Calendar },
  { id: "news",          label: "Tin tức phòng ban", icon: Newspaper },
];

const ICON_OPTIONS = [
  { value: "bell",      label: "Bell",     icon: Bell },
  { value: "megaphone", label: "Megaphone", icon: Megaphone },
  { value: "clock",     label: "Clock",    icon: Clock },
  { value: "zap",       label: "Zap",      icon: Zap },
];

const COLOR_OPTIONS = [
  { value: "from-blue-500 to-[#1F4E79]",    label: "Xanh dương" },
  { value: "from-orange-400 to-orange-600", label: "Cam" },
  { value: "from-red-400 to-rose-600",      label: "Đỏ" },
  { value: "from-green-500 to-teal-600",    label: "Xanh lá" },
  { value: "from-purple-500 to-violet-600", label: "Tím" },
];

const DEPT_OPTIONS = [
  { dept: "IT",         deptColor: "bg-blue-100 text-blue-700",     gradient: "from-blue-400 to-indigo-500" },
  { dept: "HR",         deptColor: "bg-purple-100 text-purple-700", gradient: "from-purple-400 to-violet-500" },
  { dept: "Kinh doanh", deptColor: "bg-emerald-100 text-emerald-700", gradient: "from-emerald-400 to-teal-500" },
  { dept: "Marketing",  deptColor: "bg-orange-100 text-orange-700", gradient: "from-orange-400 to-amber-500" },
  { dept: "Khác",       deptColor: "bg-gray-100 text-gray-700",     gradient: "from-gray-400 to-gray-500" },
];

const EVENT_TYPES = [
  { label: "Họp",      color: "from-[#1F4E79] to-[#2E75B6]", tagColor: "bg-blue-100 text-blue-700" },
  { label: "Deadline", color: "from-red-500 to-rose-600",     tagColor: "bg-red-100 text-red-700" },
  { label: "Đào tạo",  color: "from-emerald-500 to-teal-600", tagColor: "bg-emerald-100 text-emerald-700" },
  { label: "Sự kiện",  color: "from-purple-500 to-violet-600", tagColor: "bg-purple-100 text-purple-700" },
];

export default function AdminMedia() {
  const { darkMode: dm } = useOutletContext<DarkModeContext>();
  const [activeTab, setActiveTab] = useState("announcements");
  const token = localStorage.getItem("accessToken");

  // Data
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<DepartmentNews[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, e, n] = await Promise.all([
        fetch("/api/home/announcements", { headers }),
        fetch("/api/home/events",        { headers }),
        fetch("/api/home/news",          { headers }),
      ]);
      if (a.ok) setAnnouncements(await a.json());
      if (e.ok) setEvents(await e.json());
      if (n.ok) setNews(await n.json());
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditItem(null);
    if (activeTab === "announcements") setForm({ title: "", description: "", icon: "bell", color: COLOR_OPTIONS[0].value, isActive: true });
    if (activeTab === "events")        setForm({ title: "", date: "", time: "09:00", location: "", typeLabel: "Họp", color: EVENT_TYPES[0].color, tagColor: EVENT_TYPES[0].tagColor, isActive: true });
    if (activeTab === "news")          setForm({ title: "", summary: "", department: "IT", deptColor: DEPT_OPTIONS[0].deptColor, gradient: DEPT_OPTIONS[0].gradient, isActive: true });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editItem
        ? `/api/home/${activeTab}/${editItem.id}`
        : `/api/home/${activeTab}`;
      const method = editItem ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      if (res.ok) { await fetchAll(); setShowModal(false); }
    } catch { }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    await fetch(`/api/home/${activeTab}/${id}`, { method: "DELETE", headers });
    await fetchAll();
  };

  const bg = dm ? "bg-[#0f1117]" : "bg-gray-100";
  const card = dm ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200";
  const textMain = dm ? "text-white" : "text-gray-800";
  const textSub = dm ? "text-gray-400" : "text-gray-500";
  const inputCls = `w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${dm ? "bg-[#0f1117] border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"}`;
  const divider = dm ? "border-white/5" : "border-gray-100";

  const currentData = activeTab === "announcements" ? announcements : activeTab === "events" ? events : news;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("vi-VN");

  return (
    <div className={`min-h-full ${bg} p-6`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${textMain}`}>Nội dung & Truyền thông</h1>
        <p className={`text-sm mt-1 ${textSub}`}>Quản lý thông báo, sự kiện và tin tức hiển thị trên trang chủ</p>
      </div>

      {/* Tabs */}
      <div className={`rounded-2xl border overflow-hidden ${card}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white shadow-sm"
                    : dm ? "text-gray-400 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100"
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? "bg-white/20 text-white" : dm ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
                  {tab.id === "announcements" ? announcements.length : tab.id === "events" ? events.length : news.length}
                </span>
              </button>
            ))}
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Thêm mới
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-[#1F4E79] border-t-transparent rounded-full animate-spin" /></div>
          ) : currentData.length === 0 ? (
            <div className={`text-center py-16 ${textSub}`}>
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                {activeTab === "announcements" ? <Megaphone className="w-7 h-7 text-gray-300" /> : activeTab === "events" ? <Calendar className="w-7 h-7 text-gray-300" /> : <Newspaper className="w-7 h-7 text-gray-300" />}
              </div>
              <p className="font-medium">Chưa có dữ liệu</p>
              <p className="text-xs mt-1">Bấm "Thêm mới" để bắt đầu</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className={`border-b text-xs font-semibold uppercase tracking-wider ${divider} ${textSub}`}>
                  {activeTab === "announcements" && <>
                    <th className="px-6 py-3 text-left">Tiêu đề</th>
                    <th className="px-6 py-3 text-left">Mô tả</th>
                    <th className="px-6 py-3 text-left">Ngày tạo</th>
                    <th className="px-6 py-3 text-left">Trạng thái</th>
                    <th className="px-6 py-3 text-right">Thao tác</th>
                  </>}
                  {activeTab === "events" && <>
                    <th className="px-6 py-3 text-left">Tiêu đề</th>
                    <th className="px-6 py-3 text-left">Ngày</th>
                    <th className="px-6 py-3 text-left">Giờ</th>
                    <th className="px-6 py-3 text-left">Địa điểm</th>
                    <th className="px-6 py-3 text-left">Loại</th>
                    <th className="px-6 py-3 text-right">Thao tác</th>
                  </>}
                  {activeTab === "news" && <>
                    <th className="px-6 py-3 text-left">Tiêu đề</th>
                    <th className="px-6 py-3 text-left">Phòng ban</th>
                    <th className="px-6 py-3 text-left">Tóm tắt</th>
                    <th className="px-6 py-3 text-left">Ngày tạo</th>
                    <th className="px-6 py-3 text-right">Thao tác</th>
                  </>}
                </tr>
              </thead>
              <tbody className={`divide-y ${divider}`}>
                {activeTab === "announcements" && (announcements as Announcement[]).map(item => (
                  <tr key={item.id} className={`transition-colors ${dm ? "hover:bg-white/3" : "hover:bg-gray-50"}`}>
                    <td className={`px-6 py-4 text-sm font-medium ${textMain}`}>{item.title}</td>
                    <td className={`px-6 py-4 text-sm max-w-xs truncate ${textSub}`}>{item.description}</td>
                    <td className={`px-6 py-4 text-sm ${textSub}`}>{formatDate(item.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.isActive ? "Hiển thị" : "Ẩn"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeTab === "events" && (events as Event[]).map(item => (
                  <tr key={item.id} className={`transition-colors ${dm ? "hover:bg-white/3" : "hover:bg-gray-50"}`}>
                    <td className={`px-6 py-4 text-sm font-medium ${textMain}`}>{item.title}</td>
                    <td className={`px-6 py-4 text-sm ${textSub}`}>{new Date(item.date).toLocaleDateString("vi-VN")}</td>
                    <td className={`px-6 py-4 text-sm ${textSub}`}>{item.time}</td>
                    <td className={`px-6 py-4 text-sm max-w-xs truncate ${textSub}`}>{item.location}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.tagColor}`}>{item.typeLabel}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeTab === "news" && (news as DepartmentNews[]).map(item => (
                  <tr key={item.id} className={`transition-colors ${dm ? "hover:bg-white/3" : "hover:bg-gray-50"}`}>
                    <td className={`px-6 py-4 text-sm font-medium ${textMain}`}>{item.title}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.deptColor}`}>{item.department}</span>
                    </td>
                    <td className={`px-6 py-4 text-sm max-w-xs truncate ${textSub}`}>{item.summary}</td>
                    <td className={`px-6 py-4 text-sm ${textSub}`}>{formatDate(item.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg ${dm ? "bg-[#161b27]" : "bg-white"}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <h2 className={`text-base font-bold ${textMain}`}>
                {editItem ? "Chỉnh sửa" : "Thêm mới"} — {TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <button onClick={() => setShowModal(false)} className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-400"}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Announcement form */}
              {activeTab === "announcements" && <>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Tiêu đề *</label>
                  <input type="text" placeholder="Nhập tiêu đề..." value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Mô tả *</label>
                  <textarea placeholder="Nhập mô tả..." value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Icon</label>
                  <div className="flex gap-2">
                    {ICON_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setForm({ ...form, icon: opt.value })}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all flex flex-col items-center gap-1 ${form.icon === opt.value ? "border-[#1F4E79] bg-[#1F4E79]/10 text-[#1F4E79]" : dm ? "border-white/10 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                        <opt.icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Màu sắc</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setForm({ ...form, color: opt.value })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${form.color === opt.value ? "border-[#1F4E79]" : dm ? "border-white/10" : "border-gray-200"}`}>
                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${opt.value}`} />
                        {opt.label}
                        {form.color === opt.value && <Check className="w-3 h-3 text-[#1F4E79]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>}

              {/* Event form */}
              {activeTab === "events" && <>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Tiêu đề *</label>
                  <input type="text" placeholder="Tên sự kiện..." value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Ngày *</label>
                    <input type="date" value={form.date || ""} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Giờ *</label>
                    <input type="time" value={form.time || ""} onChange={e => setForm({ ...form, time: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Địa điểm *</label>
                  <input type="text" placeholder="Địa điểm tổ chức..." value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Loại sự kiện</label>
                  <div className="flex gap-2 flex-wrap">
                    {EVENT_TYPES.map(opt => (
                      <button key={opt.label} onClick={() => setForm({ ...form, typeLabel: opt.label, color: opt.color, tagColor: opt.tagColor })}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${form.typeLabel === opt.label ? "border-[#1F4E79] bg-[#1F4E79]/10 text-[#1F4E79]" : dm ? "border-white/10 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>}

              {/* News form */}
              {activeTab === "news" && <>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Tiêu đề *</label>
                  <input type="text" placeholder="Tiêu đề tin tức..." value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Tóm tắt *</label>
                  <textarea placeholder="Nội dung tóm tắt..." value={form.summary || ""} onChange={e => setForm({ ...form, summary: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${textSub}`}>Phòng ban</label>
                  <div className="flex gap-2 flex-wrap">
                    {DEPT_OPTIONS.map(opt => (
                      <button key={opt.dept} onClick={() => setForm({ ...form, department: opt.dept, deptColor: opt.deptColor, gradient: opt.gradient })}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${form.department === opt.dept ? "border-[#1F4E79] bg-[#1F4E79]/10 text-[#1F4E79]" : dm ? "border-white/10 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                        {opt.dept}
                      </button>
                    ))}
                  </div>
                </div>
              </>}

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${textMain}`}>Hiển thị trên trang chủ</p>
                  <p className={`text-xs ${textSub}`}>Tắt để ẩn khỏi người dùng</p>
                </div>
                <button onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-[#1F4E79]" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

            <div className={`flex justify-end gap-3 px-6 py-4 border-t ${divider}`}>
              <button onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${dm ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {editItem ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}