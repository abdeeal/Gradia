import { Navigate } from "react-router-dom";
import React from "react";

export default function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}
