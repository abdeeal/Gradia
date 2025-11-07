// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Courses from "../pages/Courses/Courses.jsx";
import Tasks from "../pages/Tasks/Tasks.jsx";
import Presence from "../pages/Presence/Presence.jsx";
import Login from "@/pages/Auth/Login/Login.jsx";
import Registration from "@/pages/Auth/Registration/Registration.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/courses" element={<Courses />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/presences" element={<Presence />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Registration />} />

      {/* optional: redirect root & typo plural */}
      <Route path="/" element={<Navigate to="/courses" replace />} />
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
}
