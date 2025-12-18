import { Navigate, useLocation } from "react-router-dom";
import React from "react";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  const user = localStorage.getItem("user");
  const workspaceId = sessionStorage.getItem("id_workspace");

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!workspaceId) {
    if (location.pathname !== "/workspaces") {
      return <Navigate to="/workspaces" replace />;
    }
  }

  return children;
}
