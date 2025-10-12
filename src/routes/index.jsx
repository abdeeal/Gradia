// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Courses from "../pages/Courses/Courses.jsx";
import Tasks from "../pages/Tasks/Tasks.jsx";
import Presence from "../pages/Presence/Presence.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/courses" element={<Courses />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/presence" element={<Presence />} />

      {/* optional: redirect root & typo plural */}
      <Route path="/" element={<Navigate to="/courses" replace />} />
      <Route path="/presences" element={<Navigate to="/presence" replace />} />
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
}
