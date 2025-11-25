  import { useLocation } from "react-router-dom";
  import AppRoutes from "./routes";
  import { Container } from "./components/Container";
  import "./App.css";
  import { Navbar } from "./components/Navbar";
  import { useMediaQuery } from "react-responsive";
  import { useEffect, useState } from "react";

function App() {
  const { pathname } = useLocation();
  const isAuthPage = pathname.startsWith("/auth") || pathname.startsWith("/workspace");
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isDashboard = pathname.startsWith("/dashboard");

return (
  <>
    {!isAuthPage && <Navbar />}

    {isMobile || isTablet ? (
      <Container noPaddingRight={isDashboard}>
        <AppRoutes />
      </Container>
    ) : (
      <Container noPadding={isAuthPage} noPaddingRight={isDashboard}>
        <AppRoutes />
      </Container>
    )}
  </>
);

  }

  export default App;
