// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Courses from "../pages/Courses/Courses.jsx";
import Tasks from "../pages/Tasks/Tasks.jsx";
import Presence from "../pages/Presence/Presence.jsx";
import Login from "@/pages/Auth/Login/Login.jsx";
import Registration from "@/pages/Auth/Registration/Registration.jsx";
import Callback from "@/pages/Auth/Callback.jsx";
import ResetPassword from "@/pages/Auth/Reset-Password/ResetPassword.jsx";
import Workspaces from "@/pages/Workspaces/Workspaces.jsx";
import Dashboard from "@/pages/Dashboard/Dashboard.jsx";
import Calendar from "@/pages/Calendar/Calendar.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/workspaces" element={<Workspaces />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/presences" element={<Presence />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Registration />} />
      <Route path="/auth/callback" element={<Callback />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* optional: redirect root & typo plural */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
}
