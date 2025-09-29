import { Routes, Route } from "react-router-dom";
import { Courses } from "../pages/Courses/Courses";

export default function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} /> */}
      <Route path="/courses" element={<Courses />} />
    </Routes>
  );
}