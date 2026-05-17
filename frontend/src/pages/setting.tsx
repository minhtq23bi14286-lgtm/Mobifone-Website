import { useState } from "react";
import {
  User, Bell, Palette, Shield, Camera, Monitor,
  ChevronRight, Check, Moon, Sun,
  Smartphone, Eye, EyeOff, Lock, Trash2, AlertTriangle,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

const TABS = [
  { id: "account",      label: "Tài khoản & Hồ sơ", icon: User },
  { id: "notification", label: "Thông báo",           icon: Bell },
  { id: "appearance",   label: "Giao diện",            icon: Palette },
  { id: "privacy",      label: "Quyền riêng tư",       icon: Shield },
];

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${value ? "bg-[#1F4E79]" : "bg-gray-300"}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{children}</h3>;
}

function SettingRow({ label, desc, children, danger }: { label: string; desc?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-sm font-medium ${danger ? "text-red-500" : "text-gray-800"}`}>{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState("account");

  const [notifications, setNotifications] = useState({
    messages: true, mentions: true, forum: false,
    announcements: true, doNotDisturb: false,
  });
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true, readReceipts: true,
  });
  const [fontSize, setFontSize] = useState("medium");
  const [language, setLanguage] = useState("vi");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const input = `w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800
    placeholder-gray-400 focus:outline-none focus:border-[#1F4E79] focus:ring-2 focus:ring-[#1F4E79]/10
    transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`;

  return (
    <div className={`h-full flex flex-col overflow-hidden transition-colors ${darkMode ? "bg-[#0f1117]" : "bg-gray-50"}`}>

      

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar tabs */}
        <div className={`w-64 flex-shrink-0 border-r overflow-y-auto ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
          <div className="p-3 space-y-0.5">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1F4E79] text-white shadow-sm"
                    : darkMode ? "text-gray-400 hover:bg-white/5 hover:text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
                {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
              </button>
            ))}
          </div>

          {/* User card at bottom */}
          <div className={`mx-3 mb-3 p-3 rounded-xl border ${darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{currentUser.displayName?.charAt(0) || "U"}</span>
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>{currentUser.displayName || "User"}</p>
                <p className={`text-[10px] truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{currentUser.email || ""}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content area — fixed height, scrollable inside */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-6 space-y-8">

            {/* ── Tài khoản & Hồ sơ ── */}
            {activeTab === "account" && (
              <>
                {/* Avatar */}
                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Ảnh đại diện</SectionTitle>
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1F4E79] to-[#2E75B6] flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{currentUser.displayName?.charAt(0) || "U"}</span>
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1F4E79] rounded-full flex items-center justify-center hover:bg-[#2E75B6] transition-colors shadow-lg">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    <div>
                      <p className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{currentUser.displayName || "User"}</p>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{currentUser.role || "Employee"} • {currentUser.department || "MobiFone"}</p>
                      <div className="flex gap-2 mt-2">
                        <button className="text-xs px-3 py-1.5 bg-[#1F4E79] text-white rounded-lg hover:bg-[#2E75B6] transition-colors font-medium">Tải ảnh lên</button>
                        <button className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${darkMode ? "border-white/10 text-gray-400 hover:bg-white/5" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>Xóa ảnh</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin cá nhân */}
                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Thông tin cá nhân</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Họ và tên", value: currentUser.displayName || "Người dùng", type: "text" },
                      { label: "Email", value: currentUser.email || "", type: "email", disabled: true },
                      { label: "Phòng ban", value: currentUser.department || "IT Department", type: "text" },
                      { label: "Chức vụ", value: "Software Engineer Intern", type: "text" },
                      { label: "Số điện thoại", value: "0123 456 789", type: "tel" },
                    ].map(field => (
                      <div key={field.label} className={field.label === "Số điện thoại" ? "col-span-2 sm:col-span-1" : ""}>
                        <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{field.label}</label>
                        <input type={field.type} defaultValue={field.value} disabled={field.disabled}
                          className={`${input} ${darkMode ? "bg-[#0f1117] border-white/10 text-white placeholder-gray-600" : ""}`} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Giới thiệu bản thân</label>
                    <textarea rows={3} defaultValue="Intern tại MobiFone, đam mê công nghệ và phát triển phần mềm."
                      className={`${input} resize-none ${darkMode ? "bg-[#0f1117] border-white/10 text-white" : ""}`} />
                  </div>
                  <div className="flex justify-end mt-4">
                    <button className="px-5 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm">
                      Lưu thay đổi
                    </button>
                  </div>
                </div>

                {/* Đổi mật khẩu */}
                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Bảo mật</SectionTitle>
                  <div className="space-y-3">
                    <div className="relative">
                      <input type={showCurrentPw ? "text" : "password"} placeholder="Mật khẩu hiện tại"
                        className={`${input} pr-10 ${darkMode ? "bg-[#0f1117] border-white/10 text-white" : ""}`} />
                      <button onClick={() => setShowCurrentPw(v => !v)} className="absolute right-3 top-2.5 text-gray-400">
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showNewPw ? "text" : "password"} placeholder="Mật khẩu mới"
                        className={`${input} pr-10 ${darkMode ? "bg-[#0f1117] border-white/10 text-white" : ""}`} />
                      <button onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-2.5 text-gray-400">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input type="password" placeholder="Xác nhận mật khẩu mới"
                      className={`${input} ${darkMode ? "bg-[#0f1117] border-white/10 text-white" : ""}`} />
                    <div className="flex justify-end">
                      <button className="px-5 py-2 bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm">
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2FA + Sessions */}
                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Phiên đăng nhập</SectionTitle>
                  <div className={`flex items-center justify-between p-4 rounded-xl mb-4 ${darkMode ? "bg-white/5" : "bg-blue-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#1F4E79] flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Xác thực 2 yếu tố (2FA)</p>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Tăng cường bảo mật tài khoản</p>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 border-2 border-[#1F4E79] text-[#1F4E79] text-sm font-semibold rounded-xl hover:bg-[#1F4E79] hover:text-white transition-colors">
                      Bật 2FA
                    </button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { device: "Chrome • Windows 11", location: "Hà Nội, VN", time: "Hiện tại", current: true, icon: Monitor },
                      { device: "Firefox • Windows 10", location: "Hà Nội, VN", time: "2 ngày trước", current: false, icon: Monitor },
                      { device: "Chrome • Android", location: "Hà Nội, VN", time: "5 ngày trước", current: false, icon: Smartphone },
                    ].map((session, i) => (
                      <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border ${darkMode ? "border-white/5 bg-white/3" : "border-gray-100 bg-gray-50"}`}>
                        <div className="flex items-center gap-3">
                          <session.icon className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-400"}`} />
                          <div>
                            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>{session.device}</p>
                            <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{session.location} • {session.time}</p>
                          </div>
                        </div>
                        {session.current
                          ? <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">Thiết bị này</span>
                          : <button className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline">Đăng xuất</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Thông báo ── */}
            {activeTab === "notification" && (
              <>
                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Kênh thông báo</SectionTitle>
                  {[
                    { key: "messages",      label: "Tin nhắn mới",           desc: "Nhận thông báo khi có tin nhắn mới" },
                    { key: "mentions",      label: "Được nhắc tên (@mention)", desc: "Thông báo khi ai đó nhắc đến bạn" },
                    { key: "forum",         label: "Bài đăng diễn đàn",       desc: "Thông báo bài đăng mới trong diễn đàn" },
                    { key: "announcements", label: "Thông báo chính thức",     desc: "Thông báo từ Ban quản trị MobiFone" },
                  ].map(item => (
                    <SettingRow key={item.key} label={item.label} desc={item.desc}>
                      <Toggle value={notifications[item.key as keyof typeof notifications]}
                        onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))} />
                    </SettingRow>
                  ))}
                </div>

                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Giờ không làm phiền</SectionTitle>
                  <SettingRow label="Bật giờ không làm phiền" desc="Tắt toàn bộ thông báo trong khung giờ này">
                    <Toggle value={notifications.doNotDisturb}
                      onChange={() => setNotifications(prev => ({ ...prev, doNotDisturb: !prev.doNotDisturb }))} />
                  </SettingRow>
                  {notifications.doNotDisturb && (
                    <div className={`flex items-center gap-4 mt-4 p-4 rounded-xl ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                      <div>
                        <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Từ</label>
                        <input type="time" defaultValue="22:00"
                          className={`h-9 px-3 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${darkMode ? "bg-[#0f1117] border-white/10 text-white" : "bg-white border-gray-200 text-gray-700"}`} />
                      </div>
                      <div className={`text-sm font-medium mt-5 ${darkMode ? "text-gray-400" : "text-gray-400"}`}>—</div>
                      <div>
                        <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Đến</label>
                        <input type="time" defaultValue="07:00"
                          className={`h-9 px-3 rounded-xl border text-sm focus:outline-none focus:border-[#1F4E79] transition-colors ${darkMode ? "bg-[#0f1117] border-white/10 text-white" : "bg-white border-gray-200 text-gray-700"}`} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Giao diện ── */}
            {activeTab === "appearance" && (
              <>
                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Chủ đề</SectionTitle>
                  <SettingRow label="Chế độ tối (Dark mode)" desc="Chuyển sang giao diện tối">
                    <Toggle value={darkMode} onChange={toggleDarkMode} />
                  </SettingRow>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {[
                      { value: "light", label: "Sáng", icon: Sun,  preview: "bg-white border-2 border-gray-200" },
                      { value: "dark",  label: "Tối",  icon: Moon, preview: "bg-gray-900 border-2 border-gray-700" },
                    ].map(theme => (
                      <button key={theme.value} onClick={() => { if (theme.value === "dark" && !darkMode) toggleDarkMode(); if (theme.value === "light" && darkMode) toggleDarkMode(); }}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          (theme.value === "dark") === darkMode
                            ? "border-[#1F4E79] bg-[#1F4E79]/5"
                            : darkMode ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                        }`}>
                        <div className={`w-full h-16 rounded-lg mb-2 ${theme.preview} flex items-center justify-center`}>
                          <theme.icon className={`w-6 h-6 ${theme.value === "dark" ? "text-gray-300" : "text-gray-500"}`} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>{theme.label}</span>
                          {(theme.value === "dark") === darkMode && <Check className="w-4 h-4 text-[#1F4E79]" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Cỡ chữ</SectionTitle>
                  <div className="flex gap-3">
                    {[
                      { value: "small",  label: "Nhỏ",  sample: "text-xs" },
                      { value: "medium", label: "Vừa",  sample: "text-sm" },
                      { value: "large",  label: "Lớn",  sample: "text-base" },
                    ].map(size => (
                      <button key={size.value} onClick={() => setFontSize(size.value)}
                        className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                          fontSize === size.value
                            ? "border-[#1F4E79] bg-[#1F4E79]/5"
                            : darkMode ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                        }`}>
                        <p className={`${size.sample} font-medium mb-1 ${darkMode ? "text-white" : "text-gray-700"}`}>Aa</p>
                        <p className={`text-xs ${fontSize === size.value ? "text-[#1F4E79]" : darkMode ? "text-gray-400" : "text-gray-500"}`}>{size.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Ngôn ngữ</SectionTitle>
                  <div className="flex gap-3">
                    {[
                      { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
                      { value: "en", label: "English",     flag: "🇬🇧" },
                    ].map(lang => (
                      <button key={lang.value} onClick={() => setLanguage(lang.value)}
                        className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          language === lang.value
                            ? "border-[#1F4E79] bg-[#1F4E79]/5"
                            : darkMode ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                        }`}>
                        <span className="text-2xl">{lang.flag}</span>
                        <div className="text-left">
                          <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>{lang.label}</p>
                          {language === lang.value && <p className="text-xs text-[#1F4E79] font-medium">Đang dùng</p>}
                        </div>
                        {language === lang.value && <Check className="w-4 h-4 text-[#1F4E79] ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Quyền riêng tư ── */}
            {activeTab === "privacy" && (
              <>
                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Hiển thị & Hoạt động</SectionTitle>
                  {[
                    { key: "showOnlineStatus", label: "Trạng thái hoạt động", desc: "Cho phép người khác thấy bạn đang online" },
                    { key: "readReceipts",     label: "Xác nhận đã đọc",      desc: "Hiển thị dấu đã đọc khi bạn xem tin nhắn" },
                  ].map(item => (
                    <SettingRow key={item.key} label={item.label} desc={item.desc}>
                      <Toggle value={privacy[item.key as keyof typeof privacy]}
                        onChange={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof privacy] }))} />
                    </SettingRow>
                  ))}
                </div>

                <div className={`rounded-2xl border p-6 ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
                  <SectionTitle>Dữ liệu & Tài khoản</SectionTitle>
                  <SettingRow label="Tải xuống dữ liệu của tôi" desc="Xuất toàn bộ dữ liệu tài khoản">
                    <button className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${darkMode ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      Xuất dữ liệu
                    </button>
                  </SettingRow>
                  <SettingRow label="Xóa tài khoản" desc="Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu" danger>
                    <button className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" /> Xóa tài khoản
                    </button>
                  </SettingRow>
                </div>

                <div className={`rounded-2xl border p-4 flex items-start gap-3 ${darkMode ? "bg-yellow-500/10 border-yellow-500/20" : "bg-yellow-50 border-yellow-200"}`}>
                  <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className={`text-xs leading-relaxed ${darkMode ? "text-yellow-300" : "text-yellow-700"}`}>
                    Mọi thay đổi về quyền riêng tư sẽ có hiệu lực ngay lập tức. Vui lòng đọc kỹ chính sách bảo mật của MobiFone trước khi thay đổi cài đặt.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}