import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Shield, FileText,
  Settings, LogOut, Menu, X,
  Sun, Moon
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Quản lý người dùng", path: "/admin/users" },
  { icon: Shield, label: "Bảo mật & Giám sát", path: "/admin/security" },
  { icon: FileText, label: "Quản lý nội dung", path: "/admin/content" },
  { icon: Settings, label: "Cấu hình hệ thống", path: "/admin/system" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
 const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      darkMode ? "bg-[#0f1117] text-white" : "bg-gray-100 text-gray-800"
    }`}>

      {/* Sidebar */}
      <aside className={`flex flex-col border-r transition-all duration-300 ${
        sidebarOpen ? "w-64" : "w-16"
      } ${darkMode ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>

        {/* Logo */}
        <div className={`flex items-center justify-between px-4 py-5 border-b ${
          darkMode ? "border-white/5" : "border-gray-100"
        }`}>
          {sidebarOpen && (
            <div>
              <div className="text-lg font-bold italic">
                <span className="text-[#0066CC]">mobi</span>
                <span className="text-[#FF0000]">f</span>
                <span className="text-[#0066CC]">one</span>
              </div>
              <p className="text-xs text-red-400 font-semibold tracking-widest uppercase mt-0.5">
                Admin Panel
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white shadow-lg shadow-blue-900/30"
                    : darkMode
                      ? "text-gray-400 hover:bg-white/5 hover:text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className={`p-3 border-t space-y-1 ${
          darkMode ? "border-white/5" : "border-gray-100"
        }`}>

          {/* User info */}
          <div className={`flex items-center gap-3 px-3 py-2 ${
            !sidebarOpen && "justify-center"
          }`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            {sidebarOpen && (
              <div>
                <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  Super Admin
                </p>
                <p className="text-xs text-red-400">admin@mobifone.vn</p>
              </div>
            )}
          </div>

          {/* Dark/Light toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              darkMode
                ? "text-gray-400 hover:bg-white/10 hover:text-white"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            {darkMode
              ? <Sun className="w-5 h-5 flex-shrink-0" />
              : <Moon className="w-5 h-5 flex-shrink-0" />
            }
            {sidebarOpen && (
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm font-medium">
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </span>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${
                  darkMode ? "bg-[#2E75B6]" : "bg-gray-300"
                }`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                    darkMode ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                </div>
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => navigate("/login")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              darkMode
                ? "text-red-400 hover:bg-red-500/10"
                : "text-red-400 hover:bg-red-50"
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto transition-colors ${
          darkMode ? "bg-[#0f1117]" : "bg-gray-100"
        }`}>
          <Outlet context={{ darkMode }} />
        </main>
      </div>
    </div>
  );
}