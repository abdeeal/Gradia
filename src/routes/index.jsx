// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// === MAIN PAGES ===
import Dashboard from "../pages/Dashboard/dashboard.jsx";
import Courses from "../pages/Courses/Courses.jsx";
import Tasks from "../pages/Tasks/Tasks.jsx";
import Presence from "../pages/Presence/Presence.jsx";
import Calendar from "../pages/Calendar/calendar.jsx"; // ✅ perbaiki ejaan dan default import

// === LOGIN & FORGOT PASSWORD PAGES ===
import Login from "../pages/Loginpage/loginpage.jsx";
import ForgetBaru from "@/pages/Loginpage/forgot-baru.jsx";
import ForgetInput from "@/pages/Loginpage/forgot-input.jsx";
import ForgotOTP from "@/pages/Loginpage/forgot-otp.jsx";
import ForgotSuccess from "@/pages/Loginpage/forgot-succes.jsx";

// === REGISTER PAGES ===
import Register from "../pages/Register/register.jsx";
import RegisterOTP from "@/pages/Register/otp.jsx";
import RegisterSuccess from "@/pages/Register/email-succes.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== MAIN APP PAGES ===== */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/calendar" element={<Calendar />} /> {/* ✅ perbaiki ejaan */}
      <Route path="/courses" element={<Courses />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/presence" element={<Presence />} />

      {/* ===== LOGIN & FORGOT PASSWORD FLOW ===== */}
      <Route path="/login" element={<Login />} />
      <Route path="/login/forgot-baru" element={<ForgetBaru />} />
      <Route path="/login/forgot-input" element={<ForgetInput />} />
      <Route path="/login/forgot-otp" element={<ForgotOTP />} />
      <Route path="/login/forgot-success" element={<ForgotSuccess />} />

      {/* ===== REGISTER FLOW ===== */}
      <Route path="/register" element={<Register />} />
      <Route path="/register/otp" element={<RegisterOTP />} />
      <Route path="/register/success" element={<RegisterSuccess />} />

      {/* ===== REDIRECTS ===== */}
      <Route path="/presences" element={<Navigate to="/presence" replace />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ===== CATCH-ALL ===== */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
