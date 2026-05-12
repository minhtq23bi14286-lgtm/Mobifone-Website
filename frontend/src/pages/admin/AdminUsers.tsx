import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Plus, Search, Edit2, Trash2, Key, RefreshCw,
  X, Check, Eye, EyeOff, Copy, CheckCircle, UserX, UserCheck,
} from "lucide-react";

interface OutletContext { darkMode: boolean; }

interface User {
  id: number;
  email: string;
  displayName: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
}

const DEPARTMENTS = [
  "IT Department", "Marketing", "HR", "Kinh doanh",
  "Chuyển đổi số", "Kế toán", "Pháp lý", "Kỹ thuật"
];
const ROLES = ["employee", "manager", "admin"];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

const ModalInput = ({
  label, value, onChange, type = "text", placeholder = "", textMain, inputBg
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; textMain: string; inputBg: string;
}) => (
  <div>
    <label className={`block text-xs font-semibold mb-1.5 ${textMain}`}>{label}</label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${inputBg}`}
    />
  </div>
);

const ModalSelect = ({
  label, value, onChange, options, textMain, inputBg
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  textMain: string; inputBg: string;
}) => (
  <div>
    <label className={`block text-xs font-semibold mb-1.5 ${textMain}`}>{label}</label>
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${inputBg}`}
    >
      {options.map((o: any) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  </div>
);

export default function AdminUsers() {
  const { darkMode } = useOutletContext<OutletContext>();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<User | null>(null);
  const [showReset, setShowReset] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState<User | null>(null);

  const [createForm, setCreateForm] = useState({
    email: "", displayName: "", password: "", role: "employee", department: "IT Department"
  });
  const [editForm, setEditForm] = useState({
    displayName: "", role: "employee", department: "IT Department"
  });
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // ── Loading states cho từng action ──
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const token = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const generatePassword = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/users/generate-password", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const { password } = await res.json();
        return password as string;
      }
    } finally { setIsGenerating(false); }
    return "";
  };

  const handleGenerateForCreate = async () => {
    const pwd = await generatePassword();
    setCreateForm(f => ({ ...f, password: pwd }));
  };

  const handleGenerateForReset = async () => {
    const pwd = await generatePassword();
    setNewPassword(pwd);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsg("Đã sao chép!");
    setTimeout(() => setCopiedMsg(""), 2000);
  };

  const showMsg = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 4000);
  };

  const handleCreate = async () => {
    if (!createForm.email || !createForm.displayName || !createForm.password) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST", headers,
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const err = await res.json();
        showMsg(err.message || "Lỗi tạo tài khoản");
        return;
      }
      const { plainPassword } = await res.json();
      setShowCreate(false);
      setCreateForm({ email: "", displayName: "", password: "", role: "employee", department: "IT Department" });
      fetchUsers();
      showMsg(`✅ Tạo tài khoản thành công! Mật khẩu: ${plainPassword}`);
    } catch { showMsg("Lỗi tạo tài khoản"); }
    finally { setIsCreating(false); }
  };

  const handleEdit = async () => {
    if (!showEdit) return;
    setIsEditing(true);
    try {
      const res = await fetch(`/api/users/${showEdit.id}`, {
        method: "PATCH", headers,
        body: JSON.stringify(editForm),
      });
      if (res.ok) { setShowEdit(null); fetchUsers(); showMsg("✅ Cập nhật thành công!"); }
    } catch { showMsg("Lỗi cập nhật"); }
    finally { setIsEditing(false); }
  };

  const handleResetPassword = async () => {
    if (!showReset) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/users/${showReset.id}/reset-password`, {
        method: "PATCH", headers,
        body: JSON.stringify({ newPassword: newPassword || undefined }),
      });
      if (res.ok) {
        const { plainPassword } = await res.json();
        setShowReset(null); setNewPassword("");
        showMsg(`✅ Đặt lại mật khẩu thành công! Mật khẩu mới: ${plainPassword}`);
      }
    } catch { showMsg("Lỗi đặt lại mật khẩu"); }
    finally { setIsResetting(false); }
  };

  const handleToggleActive = async (user: User) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}/toggle-active`, { method: "PATCH", headers });
      if (res.ok) {
        fetchUsers();
        showMsg(`✅ ${user.isActive ? "Đã vô hiệu hóa" : "Đã kích hoạt"} tài khoản ${user.displayName}`);
      }
    } catch { showMsg("Lỗi cập nhật trạng thái"); }
    finally { setTogglingId(null); }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${showDelete.id}`, { method: "DELETE", headers });
      if (res.ok) { setShowDelete(null); fetchUsers(); showMsg(`✅ Đã xóa tài khoản ${showDelete.displayName}`); }
    } catch { showMsg("Lỗi xóa tài khoản"); }
    finally { setIsDeleting(false); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" ||
      (filterStatus === "active" && u.isActive) ||
      (filterStatus === "inactive" && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const bg = darkMode ? "bg-[#0f1117]" : "bg-gray-100";
  const card = darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200";
  const textMain = darkMode ? "text-white" : "text-gray-800";
  const textSub = darkMode ? "text-gray-400" : "text-gray-500";
  const inputBg = darkMode ? "bg-[#0f1117] border-white/10 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-800 placeholder-gray-400";
  const tableHeader = darkMode ? "border-white/5 text-gray-500" : "border-gray-200 text-gray-500";
  const tableRow = darkMode ? "border-white/5 hover:bg-white/5" : "border-gray-100 hover:bg-gray-50";
  const hoverBg = darkMode ? "hover:bg-white/5" : "hover:bg-gray-50";
  const modalBg = darkMode ? "bg-[#161b27] border-white/10" : "bg-white border-gray-200";
  const divider = darkMode ? "border-white/5" : "border-gray-100";
  const modalProps = { textMain, inputBg };

  return (
    <div className={`p-6 space-y-5 h-full overflow-y-auto ${bg}`}>

      {/* Toast */}
      {actionMsg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium flex items-center gap-2 max-w-sm ${
          actionMsg.includes("Lỗi") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {actionMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${textMain}`}>Quản lý người dùng</h1>
          <p className={`text-sm mt-0.5 ${textSub}`}>{users.length} tài khoản trong hệ thống</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md">
          <Plus className="w-4 h-4" /> Tạo tài khoản
        </button>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border p-4 flex items-center gap-3 flex-wrap ${card}`}>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm theo tên hoặc email..." value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${inputBg}`} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${inputBg}`}>
          <option value="all">Tất cả vai trò</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm focus:outline-none ${inputBg}`}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã vô hiệu hóa</option>
        </select>
        <button onClick={fetchUsers} className={`p-2 rounded-xl border transition-colors ${inputBg} ${hoverBg}`}>
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
        <span className={`text-xs ${textSub}`}>{filtered.length} kết quả</span>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden ${card}`}>
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-4 border-[#1F4E79] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={`text-xs border-b ${tableHeader}`}>
                <th className="text-left px-5 py-3">Người dùng</th>
                <th className="text-left px-5 py-3">Phòng ban</th>
                <th className="text-left px-5 py-3">Vai trò</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-left px-5 py-3">Ngày tạo</th>
                <th className="text-left px-5 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={`text-center py-12 text-sm ${textSub}`}>Không tìm thấy người dùng nào</td></tr>
              )}
              {filtered.map(user => (
                <tr key={user.id} className={`border-b transition-colors ${tableRow}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.isActive ? "bg-gradient-to-br from-[#1F4E79] to-[#2E75B6]" : "bg-gray-300"
                      }`}>
                        <span className="text-white text-xs font-bold">{user.displayName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${textMain}`}>{user.displayName}</p>
                        <p className={`text-xs ${textSub}`}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className={`text-xs ${textSub}`}>{user.department}</span></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.role === "admin" ? "bg-red-500/10 text-red-400" :
                      user.role === "manager" ? "bg-purple-500/10 text-purple-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>{user.role}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-400" : "bg-gray-400"}`} />
                      <span className={`text-xs ${textSub}`}>{user.isActive ? "Hoạt động" : "Vô hiệu hóa"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className={`text-xs ${textSub}`}>{formatDate(user.createdAt)}</span></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setShowEdit(user); setEditForm({ displayName: user.displayName, role: user.role, department: user.department }); }}
                        title="Chỉnh sửa" className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-blue-500 hover:bg-blue-50">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setShowReset(user); setNewPassword(""); }}
                        title="Đặt lại mật khẩu" className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-orange-500 hover:bg-orange-50">
                        <Key className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggleActive(user)}
                        disabled={togglingId === user.id}
                        title={user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${user.isActive ? "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50" : "text-gray-400 hover:text-green-500 hover:bg-green-50"}`}>
                        {togglingId === user.id
                          ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          : user.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setShowDelete(user)}
                        title="Xóa tài khoản" className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal: Tạo tài khoản ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md border ${modalBg}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <h2 className={`font-bold ${textMain}`}>Tạo tài khoản mới</h2>
              </div>
              <button onClick={() => setShowCreate(false)} disabled={isCreating}
                className={`p-1.5 rounded-lg ${hoverBg} ${textSub}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <ModalInput {...modalProps} label="Họ và tên *" value={createForm.displayName}
                onChange={v => setCreateForm(f => ({ ...f, displayName: v }))} placeholder="Nguyễn Văn A" />
              <ModalInput {...modalProps} label="Email *" value={createForm.email}
                onChange={v => setCreateForm(f => ({ ...f, email: v }))} type="email" placeholder="email@mobifone.vn" />
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${textMain}`}>Mật khẩu *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPassword ? "text" : "password"} value={createForm.password}
                      onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Nhập hoặc generate..."
                      className={`w-full px-3 py-2 pr-10 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${inputBg}`} />
                    <button onClick={() => setShowPassword(v => !v)} className="absolute right-2.5 top-2.5 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={handleGenerateForCreate} disabled={isGenerating}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60">
                    {isGenerating ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Generate
                  </button>
                  {createForm.password && (
                    <button onClick={() => copyToClipboard(createForm.password)}
                      className="px-2 py-2 rounded-xl border text-gray-400 hover:text-green-500 transition-colors flex-shrink-0">
                      {copiedMsg ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {copiedMsg && <p className="text-xs text-green-500 mt-1">{copiedMsg}</p>}
              </div>
              <ModalSelect {...modalProps} label="Vai trò" value={createForm.role}
                onChange={v => setCreateForm(f => ({ ...f, role: v }))}
                options={ROLES.map(r => ({ value: r, label: r }))} />
              <ModalSelect {...modalProps} label="Phòng ban" value={createForm.department}
                onChange={v => setCreateForm(f => ({ ...f, department: v }))}
                options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-2 ${divider}`}>
              <button onClick={() => setShowCreate(false)} disabled={isCreating}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${inputBg} ${hoverBg}`}>Hủy</button>
              <button onClick={handleCreate} disabled={isCreating}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-60">
                {isCreating ? <><Spinner />Đang tạo...</> : "Tạo tài khoản"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Chỉnh sửa ── */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md border ${modalBg}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Edit2 className="w-4 h-4 text-white" />
                </div>
                <h2 className={`font-bold ${textMain}`}>Chỉnh sửa — {showEdit.displayName}</h2>
              </div>
              <button onClick={() => setShowEdit(null)} disabled={isEditing}
                className={`p-1.5 rounded-lg ${hoverBg} ${textSub}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <ModalInput {...modalProps} label="Họ và tên" value={editForm.displayName}
                onChange={v => setEditForm(f => ({ ...f, displayName: v }))} />
              <ModalSelect {...modalProps} label="Vai trò" value={editForm.role}
                onChange={v => setEditForm(f => ({ ...f, role: v }))}
                options={ROLES.map(r => ({ value: r, label: r }))} />
              <ModalSelect {...modalProps} label="Phòng ban" value={editForm.department}
                onChange={v => setEditForm(f => ({ ...f, department: v }))}
                options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-2 ${divider}`}>
              <button onClick={() => setShowEdit(null)} disabled={isEditing}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${inputBg} ${hoverBg}`}>Hủy</button>
              <button onClick={handleEdit} disabled={isEditing}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-60">
                {isEditing ? <><Spinner />Đang lưu...</> : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Reset mật khẩu ── */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md border ${modalBg}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <Key className="w-4 h-4 text-white" />
                </div>
                <h2 className={`font-bold ${textMain}`}>Đặt lại mật khẩu</h2>
              </div>
              <button onClick={() => setShowReset(null)} disabled={isResetting}
                className={`p-1.5 rounded-lg ${hoverBg} ${textSub}`}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={`text-sm font-semibold ${textMain}`}>{showReset.displayName}</p>
                <p className={`text-xs ${textSub}`}>{showReset.email}</p>
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${textMain}`}>Mật khẩu mới</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showPassword ? "text" : "password"} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Để trống để generate tự động..."
                      className={`w-full px-3 py-2 pr-10 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] ${inputBg}`} />
                    <button onClick={() => setShowPassword(v => !v)} className="absolute right-2.5 top-2.5 text-gray-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={handleGenerateForReset} disabled={isGenerating}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60">
                    {isGenerating ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Generate
                  </button>
                  {newPassword && (
                    <button onClick={() => copyToClipboard(newPassword)}
                      className="px-2 py-2 rounded-xl border text-gray-400 hover:text-green-500 transition-colors flex-shrink-0">
                      {copiedMsg ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                <p className={`text-xs mt-1.5 ${textSub}`}>Nếu để trống, hệ thống sẽ tự generate mật khẩu ngẫu nhiên</p>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex justify-end gap-2 ${divider}`}>
              <button onClick={() => setShowReset(null)} disabled={isResetting}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${inputBg} ${hoverBg}`}>Hủy</button>
              <button onClick={handleResetPassword} disabled={isResetting}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-60">
                {isResetting ? <><Spinner />Đang đặt lại...</> : "Đặt lại mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Xác nhận xóa ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-sm border ${modalBg}`}>
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h2 className={`font-bold text-lg ${textMain}`}>Xóa tài khoản?</h2>
                <p className={`text-sm mt-1 ${textSub}`}>
                  Tài khoản <span className="font-semibold text-red-500">{showDelete.displayName}</span> sẽ bị vô hiệu hóa. Bạn có thể kích hoạt lại sau.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowDelete(null)} disabled={isDeleting}
                  className={`flex-1 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${inputBg} ${hoverBg}`}>Hủy</button>
                <button onClick={handleDelete} disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                  {isDeleting ? <><Spinner />Đang xóa...</> : "Xác nhận xóa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
