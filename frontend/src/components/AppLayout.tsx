import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { useThemeStore } from "../store/useThemeStore";

export default function AppLayout() {
  const { darkMode } = useThemeStore();

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
      darkMode ? "bg-[#0f1628]" : "bg-gray-100"
    }`}>
      {/* Navbar trên cùng */}
      <Navbar />

      
     <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}