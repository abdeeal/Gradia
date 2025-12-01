import { useLocation } from "react-router-dom";
import AppRoutes from "./routes";
import { Container } from "./components/Container";
import "./App.css";
import { Navbar } from "./components/Navbar";
import { useMediaQuery } from "react-responsive";
import { useEffect, useState } from "react";

function App() {
  const { pathname } = useLocation();
  const isAuthPage =
    pathname.startsWith("/auth") || pathname.startsWith("/workspace");
  
  const isLanding = pathname === "/";
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isDashboard = pathname.startsWith("/dashboard");
  const navbarAllowedRoutes = [
    "/dashboard",
    "/calendar",
    "/courses",
    "/tasks",
    "/presences",
  ];

  const showNavbar = navbarAllowedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  return (
    <>
      {showNavbar && <Navbar />}

      {isMobile || isTablet ? (
        <Container noPaddingRight={isDashboard} noPadding={isLanding}>
          <AppRoutes />
        </Container>
      ) : (
        <Container noPadding={isAuthPage ||isLanding} noPaddingRight={isDashboard}>
          <AppRoutes />
        </Container>
      )}
    </>
  );
}

export default App;
