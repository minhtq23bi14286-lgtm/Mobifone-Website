import { useState } from "react";
import { User, Bell, Palette, Shield, Camera, Key, Monitor, LogOut } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

const tabs = [
  { id: "account", label: "Tài khoản & Hồ sơ", icon: User },
  { id: "notification", label: "Thông báo", icon: Bell },
  { id: "appearance", label: "Giao diện", icon: Palette },
  { id: "privacy", label: "Quyền riêng tư", icon: Shield },
];

export default function Settings() {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState("account");
  const [notifications, setNotifications] = useState({
    messages: true,
    mentions: true,
    forum: false,
    announcements: true,
    doNotDisturb: false,
  });
  const [privacy, setPrivacy] = useState({
    showOnlineStatus: true,
    readReceipts: true,
  });
  const [appearance, setAppearance] = useState({
    darkMode: false,
    fontSize: "medium",
    language: "vi",
  });

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
        value ? "bg-[#1F4E79]" : "bg-gray-300"
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
        value ? "translate-x-7" : "translate-x-1"
      }`} />
    </button>
  );

  const inputClass = "w-full h-10 px-3 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#2E75B6] transition-colors [&:-webkit-autofill]:!bg-white [&:-webkit-autofill]:![background-color:white]";
  const inputDisabledClass = "w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed";
  const textareaClass = "w-full px-3 py-2 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#2E75B6] transition-colors resize-none";
  const timeInputClass = "h-9 px-3 bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-[#2E75B6] transition-colors";

  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-y-scroll custom-scrollbar">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt</h1>

      <div className="flex gap-6">

        {/* Tab list bên trái */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#1F4E79] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nội dung bên phải */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Tài khoản & Hồ sơ */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800">Tài khoản & Hồ sơ</h2>

              {/* Ảnh đại diện */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#1F4E79] flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">T</span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#2E75B6] rounded-full flex items-center justify-center hover:bg-[#1F4E79] transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Trần Quang Minh</p>
                  <p className="text-sm text-gray-500">Employee • IT Department</p>
                  <button className="text-sm text-[#1F4E79] hover:underline mt-1">Đổi ảnh đại diện</button>
                </div>
              </div>

              {/* Thông tin cá nhân */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700">Thông tin cá nhân</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Họ và tên</label>
                    <input
                      type="text"
                      defaultValue="Trần Quang Minh"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue="quangminh@mobifone.vn"
                      className={inputDisabledClass}
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Phòng ban</label>
                    <input
                      type="text"
                      defaultValue="IT Department"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Chức vụ</label>
                    <input
                      type="text"
                      defaultValue="Software Engineer Intern"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      defaultValue="0123 456 789"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Giới thiệu bản thân</label>
                  <textarea
                    defaultValue="Intern tại MobiFone, đam mê công nghệ và phát triển phần mềm."
                    rows={3}
                    className={textareaClass}
                  />
                </div>
                <button className="px-6 py-2 bg-[#1F4E79] text-white text-sm font-semibold rounded-lg hover:bg-[#2E75B6] transition-colors">
                  Lưu thay đổi
                </button>
              </div>

              {/* Đổi mật khẩu */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Đổi mật khẩu
                </h3>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Mật khẩu hiện tại"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    placeholder="Mật khẩu mới"
                    className={inputClass}
                  />
                  <input
                    type="password"
                    placeholder="Xác nhận mật khẩu mới"
                    className={inputClass}
                  />
                  <button className="px-6 py-2 bg-[#1F4E79] text-white text-sm font-semibold rounded-lg hover:bg-[#2E75B6] transition-colors">
                    Đổi mật khẩu
                  </button>
                </div>
              </div>

              {/* 2FA */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-[#1F4E79]" />
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">Xác thực 2 yếu tố (2FA)</p>
                    <p className="text-xs text-gray-500">Tăng cường bảo mật tài khoản</p>
                  </div>
                </div>
                <button className="px-4 py-1.5 border border-[#1F4E79] text-[#1F4E79] text-sm font-medium rounded-lg hover:bg-[#1F4E79] hover:text-white transition-colors">
                  Bật 2FA
                </button>
              </div>

              {/* Phiên đăng nhập */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Phiên đăng nhập
                </h3>
                {[
                  { device: "Chrome • Windows 11", location: "Hà Nội, Việt Nam", time: "Hiện tại", current: true },
                  { device: "Firefox • Windows 10", location: "Hà Nội, Việt Nam", time: "2 ngày trước", current: false },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{session.device}</p>
                      <p className="text-xs text-gray-500">{session.location} • {session.time}</p>
                    </div>
                    {session.current ? (
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">Thiết bị này</span>
                    ) : (
                      <button className="text-xs text-red-500 hover:text-red-700 font-medium">Đăng xuất</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thông báo */}
          {activeTab === "notification" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800">Thông báo</h2>
              <div className="space-y-4">
                {[
                  { key: "messages", label: "Tin nhắn mới", desc: "Nhận thông báo khi có tin nhắn mới" },
                  { key: "mentions", label: "Được nhắc tên (@mention)", desc: "Thông báo khi ai đó nhắc đến bạn" },
                  { key: "forum", label: "Bài đăng diễn đàn", desc: "Thông báo bài đăng mới trong diễn đàn" },
                  { key: "announcements", label: "Thông báo chính thức", desc: "Thông báo từ Ban quản trị MobiFone" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle
                      value={notifications[item.key as keyof typeof notifications]}
                      onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                    />
                  </div>
                ))}

                {/* Giờ không làm phiền */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">Giờ không làm phiền</p>
                      <p className="text-xs text-gray-500 mt-0.5">Tắt toàn bộ thông báo trong khung giờ này</p>
                    </div>
                    <Toggle
                      value={notifications.doNotDisturb}
                      onChange={() => setNotifications(prev => ({ ...prev, doNotDisturb: !prev.doNotDisturb }))}
                    />
                  </div>
                  {notifications.doNotDisturb && (
                    <div className="flex items-center gap-3 pt-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Từ</label>
                        <input type="time" defaultValue="22:00" className={timeInputClass} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Đến</label>
                        <input type="time" defaultValue="07:00" className={timeInputClass} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Giao diện */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800">Giao diện</h2>

              {/* Dark mode */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-700 text-sm">Chế độ tối (Dark mode)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Chuyển sang giao diện tối</p>
                </div>
                <Toggle
                  value={darkMode}
                  onChange={toggleDarkMode}
                />
              </div>

              {/* Cỡ chữ */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="font-medium text-gray-700 text-sm">Cỡ chữ</p>
                <div className="flex gap-3">
                  {[
                    { value: "small", label: "Nhỏ" },
                    { value: "medium", label: "Vừa" },
                    { value: "large", label: "Lớn" },
                  ].map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setAppearance(prev => ({ ...prev, fontSize: size.value }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        appearance.fontSize === size.value
                          ? "bg-[#1F4E79] text-white border-[#1F4E79]"
                          : "bg-white text-gray-600 border-gray-300 hover:border-[#1F4E79]"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ngôn ngữ */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="font-medium text-gray-700 text-sm">Ngôn ngữ</p>
                <div className="flex gap-3">
                  {[
                    { value: "vi", label: "🇻🇳 Tiếng Việt" },
                    { value: "en", label: "🇬🇧 English" },
                  ].map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => setAppearance(prev => ({ ...prev, language: lang.value }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        appearance.language === lang.value
                          ? "bg-[#1F4E79] text-white border-[#1F4E79]"
                          : "bg-white text-gray-600 border-gray-300 hover:border-[#1F4E79]"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quyền riêng tư */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800">Quyền riêng tư</h2>
              <div className="space-y-4">
                {[
                  { key: "showOnlineStatus", label: "Trạng thái hoạt động", desc: "Cho phép người khác thấy bạn đang online" },
                  { key: "readReceipts", label: "Xác nhận đã đọc", desc: "Hiển thị dấu đã đọc khi bạn xem tin nhắn" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle
                      value={privacy[item.key as keyof typeof privacy]}
                      onChange={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof privacy] }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
