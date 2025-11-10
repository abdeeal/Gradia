import { useLocation } from "react-router-dom";
import AppRoutes from "./routes";
import { Container } from "./components/Container";
import "./App.css";
import { Navbar } from "./components/Navbar";

function App() {
  const { pathname } = useLocation();
  sessionStorage.setItem("id_workspace", "1");
  const isAuthPage =
    pathname.startsWith("/auth") || pathname.startsWith("/workspace");

  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Container noPadding={isAuthPage} noPaddingRight={isDashboard}>
        <AppRoutes />
      </Container>
    </>
  );
}

export default App;
