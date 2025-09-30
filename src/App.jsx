import { useMatch } from "react-router-dom";
import AppRoutes from "./routes";
import { Container } from "./components/Container";
import "./App.css";

function App() {
  const match = useMatch("/");
  const msg =
    "Jangan otak atik file ini, kalau mau edit file course ada di /Pages/courses/ buat ngakses halamannya ada di /courses";
  return (
    <>
      {match ? msg : ""}
      <Container>
        <AppRoutes />
      </Container>
    </>
  );
}

export default App;
