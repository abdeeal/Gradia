import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute";
import React from "react";

const Courses = lazy(() => import("@/pages/Courses/Courses.jsx"));
const Tasks = lazy(() => import("@/pages/Tasks/Tasks.jsx"));
const Presence = lazy(() => import("@/pages/Presence/Presence.jsx"));
const CalendarMain = lazy(() => import("@/pages/Calendar/Calendar.jsx"));
const Registration = lazy(() =>
  import("@/pages/Auth/Registration/Registration.jsx")
);
const Login = lazy(() => import("@/pages/Auth/Login/Login.jsx"));
const VerifyOtp = lazy(() => import("@/pages/Auth/Verify-otp/VerifyOtp.jsx"));
const SuccessMsg = lazy(() =>
  import("@/pages/Auth/Success-msg/SuccessMsg.jsx")
);
const ResetPassword = lazy(() =>
  import("@/pages/Auth/Reset-Password/ResetPassword.jsx")
);
const Dashboard = lazy(() => import("@/pages/Dashboard/Dashboard.jsx"));
const WorkspacesPage = lazy(() => import("@/pages/Workspaces/Workspaces.jsx"));

export default function AppRoutes() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarMain />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/presences"
          element={
            <ProtectedRoute>
              <Presence />
            </ProtectedRoute>
          }
        />

        <Route
          path="/workspaces"
          element={
            <ProtectedRoute>
              <WorkspacesPage />
            </ProtectedRoute>
          }
        />

        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Registration />} />
        <Route path="/auth/verify-otp" element={<VerifyOtp />} />

        <Route
          path="/auth/reset-password/email"
          element={<ResetPassword initialStep="email" />}
        />
        <Route
          path="/auth/reset-password/newpassword"
          element={<ResetPassword initialStep="newPw" />}
        />
        <Route
          path="/auth/reset-password"
          element={<Navigate to="/auth/reset-password/email" replace />}
        />

        <Route path="/auth/success" element={<SuccessMsg />} />
        <Route
          path="/auth/success/register"
          element={<SuccessMsg type="register" />}
        />
        <Route
          path="/auth/success/reset"
          element={<SuccessMsg type="reset" />}
        />

        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Suspense>
  );
}
