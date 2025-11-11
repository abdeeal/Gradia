// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// === MAIN APP PAGES ===
import Courses from "@/pages/Courses/Courses.jsx";
import Tasks from "@/pages/Tasks/Tasks.jsx";
import Presence from "@/pages/Presence/Presence.jsx";
import Calendar from "@/pages/Courses/Calendar.jsx";

// === AUTH PAGES ===
import Registration from "@/pages/Auth/Registration/Registration.jsx";
import Login from "@/pages/Auth/Login/Login.jsx";
import VerifyOtp from "@/pages/Auth/Verify-otp/VerifyOtp.jsx";
import SuccessMsg from "@/pages/Auth/Success-msg/SuccessMsg.jsx";
import ResetPassword from "@/pages/Auth/Reset-Password/ResetPassword.jsx";
import Dashboard from "@/pages/Dashboard/Dashboard.jsx";
import Calendar from "@/pages/Calendar/Calendar.jsx";

// === WORKSPACE PAGE ===
import WorkspacesPage from "@/pages/Workspaces/Workspaces";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== MAIN APP PAGES ===== */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/presence" element={<Presence />} />

      {/* ===== AUTH FLOW ===== */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Registration />} />
      <Route path="/auth/verify-otp" element={<VerifyOtp />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* ===== SUCCESS PAGES (tanpa ubah UI komponen) ===== */}
      <Route path="/auth/success" element={<SuccessMsg />} />
      <Route path="/auth/success/register" element={<SuccessMsg type="register" />} />
      <Route path="/auth/success/reset" element={<SuccessMsg type="reset" />} />

      {/* ===== WORKSPACE FLOW ===== */}
      <Route path="/workspace" element={<WorkspacesPage />} />

      {/* ===== REDIRECTS (legacy) ===== */}
      <Route path="/presences" element={<Navigate to="/presence" replace />} />

      {/* ===== DEFAULT ROUTE ===== */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* ===== CATCH-ALL (404 redirect) ===== */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
