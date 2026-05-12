import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Shield, FileText,
  Settings, LogOut, Menu, X, Sun, Moon,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard",          path: "/admin" },
  { icon: Users,           label: "Quản lý người dùng", path: "/admin/users" },
  { icon: Shield,          label: "Bảo mật & Giám sát", path: "/admin/security" },
  { icon: FileText,        label: "Quản lý nội dung",   path: "/admin/content" },
  { icon: Settings,        label: "Cấu hình hệ thống",  path: "/admin/system" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const dm = darkMode;
  const sidebarBg = dm ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200";
  const textSub = dm ? "text-gray-400" : "text-gray-500";
  const hoverBg = dm ? "hover:bg-white/5 hover:text-white" : "hover:bg-gray-100 hover:text-gray-800";

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full`}>
      {/* Logo */}
      <div className={`flex items-center justify-between px-4 py-5 border-b ${dm ? "border-white/5" : "border-gray-100"}`}>
        <div>
          <div className="text-lg font-bold italic">
            <span className="text-[#0066CC]">mobi</span>
            <span className="text-[#FF0000]">f</span>
            <span className="text-[#0066CC]">one</span>
          </div>
          {(sidebarOpen || mobile) && (
            <p className="text-xs text-red-400 font-semibold tracking-widest uppercase mt-0.5">Admin Panel</p>
          )}
        </div>
        {!mobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}
        {mobile && (
          <button onClick={() => setMobileOpen(false)}
            className={`p-1.5 rounded-lg transition-colors ${dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.path}
              onClick={() => { navigate(item.path); if (mobile) setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] text-white shadow-lg shadow-blue-900/30"
                  : `${textSub} ${hoverBg}`
              }`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(sidebarOpen || mobile) && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className={`p-3 border-t space-y-1 ${dm ? "border-white/5" : "border-gray-100"}`}>
        {/* User info */}
        <div className={`flex items-center gap-3 px-3 py-2 ${!sidebarOpen && !mobile ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          {(sidebarOpen || mobile) && (
            <div>
              <p className={`text-sm font-semibold ${dm ? "text-white" : "text-gray-800"}`}>Super Admin</p>
              <p className="text-xs text-red-400">admin@mobifone.vn</p>
            </div>
          )}
        </div>

        {/* Dark mode */}
        <button onClick={() => setDarkMode(!dm)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${textSub} ${hoverBg}`}>
          {dm ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          {(sidebarOpen || mobile) && (
            <div className="flex items-center justify-between flex-1">
              <span className="text-sm font-medium">{dm ? "Light Mode" : "Dark Mode"}</span>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${dm ? "bg-[#2E75B6]" : "bg-gray-300"}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${dm ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </div>
          )}
        </button>

        {/* Logout */}
        <button onClick={() => navigate("/login")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${dm ? "text-red-400 hover:bg-red-500/10" : "text-red-400 hover:bg-red-50"}`}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(sidebarOpen || mobile) && <span className="text-sm font-medium">Đăng xuất</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${dm ? "bg-[#0f1117] text-white" : "bg-gray-100 text-gray-800"}`}>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col border-r transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-64" : "w-16"} ${sidebarBg}`}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className={`absolute left-0 top-0 h-full w-72 flex flex-col border-r z-10 ${sidebarBg}`}>
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile topbar */}
        <div className={`md:hidden flex items-center justify-between px-4 py-3 border-b ${dm ? "bg-[#161b27] border-white/5" : "bg-white border-gray-200"}`}>
          <button onClick={() => setMobileOpen(true)}
            className={`p-2 rounded-lg transition-colors ${dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-base font-bold italic">
            <span className="text-[#0066CC]">mobi</span>
            <span className="text-[#FF0000]">f</span>
            <span className="text-[#0066CC]">one</span>
            <span className={`text-xs font-semibold ml-1 ${dm ? "text-gray-400" : "text-gray-500"}`}>Admin</span>
          </div>
          <button onClick={() => setDarkMode(!dm)}
            className={`p-2 rounded-lg transition-colors ${dm ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
            {dm ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <main className={`flex-1 overflow-y-auto transition-colors ${dm ? "bg-[#0f1117]" : "bg-gray-100"}`}>
          <Outlet context={{ darkMode }} />
        </main>
      </div>
    </div>
  );
}