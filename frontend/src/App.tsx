import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useThemeStore } from "./store/useThemeStore";
import Login from "./pages/login";
import AppLayout from "./components/AppLayout";
import Home from "./pages/home";
import Setting from "./pages/setting";
import Forum from "./pages/forum";
import Chat from "./pages/chat";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Contact from "./pages/contact";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminContent from "./pages/admin/AdminContent";
import AdminSystem from "./pages/admin/Adminsystem";

function App() {
  const { darkMode } = useThemeStore();  // ✅ bên trong App

  useEffect(() => {                       // ✅ bên trong App
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route element={
          <ProtectedRoute>
            
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/feed" element={<div className="p-6">Feed (coming soon)</div>} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/settings" element={<Setting />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        <Route element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
          <Route path="/admin/content" element={<AdminContent />} />
          <Route path="/admin/system" element={<AdminSystem />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;