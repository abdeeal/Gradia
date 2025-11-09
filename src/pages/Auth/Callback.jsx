import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Background from "./Login/components/Background";
import Logo from "@/components/Logo";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");

    if (userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("user", JSON.stringify(user));
        navigate("/dashboard");
      } catch {
        navigate("/auth/login");
      }
    } else {
      navigate("/auth/login");
    }
  }, [navigate]);
  return (
    <div className="text-foreground min-h-dvh relative flex flex-col">
      <Background />
      <Logo />

      <div
        id="hero"
        className="flex flex-col w-full flex-1 items-center z-10 relative pb-6 justify-center"
      >
        <div className="w-full">
          <div className="flex flex-col items-center mt-4">
            <p className="font-montserrat font-bold text-[32px] text-center bg-gradient-to-t from-[#949494] to-[#FAFAFA] bg-clip-text text-transparent">
              Log in using Google
            </p>
            <p className="text-center text-foreground-secondary mt-8 px-4">
              Logging you in...
            </p>
          </div>
        </div>

        <div
          id="body-section"
          className="flex flex-col w-full py-9 px-3 gap-8 rounded-[12px] mt-8 text-center text-foreground-secondary"
        >
        </div>
      </div>
    </div>
  );
};

export default Callback;
