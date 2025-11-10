import { useLocation } from "react-router-dom";
import AppRoutes from "./routes";
import { Container } from "./components/Container";
import "./App.css";
import { Navbar } from "./components/Navbar";

function App() {
  const location = useLocation();

  const hideNavbar =
    location.pathname.startsWith("/auth") ||
    location.pathname === "/workspaces";

  sessionStorage.setItem("id_workspace", "1");

  const msg =
    "Jangan otak atik file ini, kalau mau edit file course ada di /Pages/courses/ buat ngakses halamannya ada di /courses";

  return (
    <>
      {location.pathname === "/" ? msg : ""}
      <Container>
        {!hideNavbar && <Navbar />}
        <AppRoutes />
      </Container>
    </>
  );
}

export default App;
