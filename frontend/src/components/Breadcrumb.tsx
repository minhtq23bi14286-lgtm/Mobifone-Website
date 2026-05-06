import { useLocation, useNavigate } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

const routeNames: Record<string, string> = {
  home: "Trang chủ",
  chat: "Tin nhắn",
  forum: "Diễn đàn",
  settings: "Cài đặt",
  feed: "Mạng nội bộ",
  admin: "Admin",
  users: "Quản lý người dùng",
  security: "Bảo mật & Giám sát",
  content: "Quản lý nội dung",
  system: "Cấu hình hệ thống",
};

export default function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useThemeStore();

  // Tách path thành các segment
  const segments = location.pathname
    .split("/")
    .filter(Boolean);

  // Build các breadcrumb items
  const crumbs = segments.map((seg, index) => {
    const path = "/" + segments.slice(0, index + 1).join("/");
    const label = routeNames[seg] || seg;
    const isLast = index === segments.length - 1;
    return { path, label, isLast };
  });

  return (
  <div className={`w-full flex items-center gap-1.5 px-6 py-3 border-b text-sm transition-colors ${
    darkMode
      ? "bg-[#161b27] border-white/5"
      : "bg-white border-gray-100"
  }`}>

      {/* Home icon */}
      <button
        onClick={() => navigate("/home")}
        className={`p-1 rounded-lg transition-colors ${
          darkMode
            ? "text-gray-400 hover:text-white hover:bg-white/10"
            : "text-gray-400 hover:text-[#1F4E79] hover:bg-blue-50"
        }`}
      >
        <Home className="w-4 h-4" />
      </button>

      {/* Segments */}
      {crumbs.map((crumb) => (
        <div key={crumb.path} className="flex items-center gap-1.5">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {crumb.isLast ? (
            <span className={`font-semibold ${
              darkMode ? "text-white" : "text-[#1F4E79]"
            }`}>
              {crumb.label}
            </span>
          ) : (
            <button
              onClick={() => navigate(crumb.path)}
              className={`transition-colors hover:underline ${
                darkMode
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-[#1F4E79]"
              }`}
            >
              {crumb.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}