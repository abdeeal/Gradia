import { Navigate } from "react-router-dom";
import React from "react";

export default function LandingGuard({ children }) {
  const user = localStorage.getItem("user");

  // flag hanya sekali
  const hasRedirected = sessionStorage.getItem("landing_redirected");

  if (user && !hasRedirected) {
    sessionStorage.setItem("landing_redirected", "true");
    return <Navigate to="/workspaces" replace />;
  }

  return children;
}
