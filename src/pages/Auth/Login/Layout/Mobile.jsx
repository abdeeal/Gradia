import React, { useState } from "react";
import Background from "../components/Background";
import Logo from "@/components/Logo";
import Input from "../components/Input";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import google from "@/assets/google.svg";
import VerifyOtp from "../../Verify-otp/VerifyOtp";

const Mobile = () => {
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [expiredAt, setExpiredAt] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setErrorMsg("");

    if (!text || !password) {
      setErrorMsg("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // jika user belum verifikasi
      if (data.otp_required) {
        setEmailToVerify(text);
        setExpiredAt(data.expires_at);
        setShowVerify(true);
        return;
      }

      // jika user sudah verified → login sukses
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setErrorMsg(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch("/api/auth/google/server");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error("Google login error:", err);
      setErrorMsg("Google login failed. Please try again.");
    }
  };

  // ✅ jika user perlu verifikasi OTP
  if (showVerify) {
    return <VerifyOtp email={emailToVerify} expiredAt={expiredAt} from={'login'} user={JSON.stringify(data.user)} />;
  }

  return (
    <div className="text-foreground min-h-dvh relative">
      <Background />

      <div className="flex flex-col w-full min-h-dvh items-center z-10 relative pb-6">
        {/* Bagian atas */}
        <div className="w-full">
          <div className="w-full flex justify-start">
            <Logo />
          </div>
          <div className="flex flex-col items-center mt-4">
            <p className="font-montserrat font-bold text-[32px] bg-gradient-to-t from-[#949494] to-[#FAFAFA] bg-clip-text text-transparent">
              Welcome Back
            </p>
            <p className="text-center text-foreground-secondary mt-3 px-4">
              Gradia helps you organize, login, and turn your self-management
              into real results.
            </p>
          </div>
        </div>

        {/* Body section */}
        <div
          id="body-section"
          className="flex-1 flex flex-col w-full py-9 bg-white/5 px-3 gap-4 rounded-[12px] mt-8 justify-between"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-6">
              <Input
                placeholder={"your-email@mail.com"}
                title={"Email"}
                value={text}
                type="email"
                onChange={(e) => setText(e.target.value)}
              />
              <Input
                placeholder={"********"}
                title={"Password"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Pesan error */}
            <p
              id="errormsg"
              className={`text-[14px] transition-all duration-200 ${
                errorMsg ? "text-red-400 opacity-100" : "opacity-0"
              }`}
            >
              {errorMsg || "Placeholder"}
            </p>

            <Link
              to={"#"}
              className="text-[14px] text-end text-foreground-secondary"
            >
              Forgot password?
            </Link>

            <div className="flex flex-col gap-4 w-full items-center">
              <div className="flex items-center w-full gap-3">
                <div className="flex-1 border-t border-border/50"></div>
                <span className="text-foreground-secondary">or</span>
                <div className="flex-1 border-t border-border/50"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="px-4 w-fit py-4 border border-border rounded-[12px] flex justify-center items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <img src={google} alt="google-logo" className="w-[22px]" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[14px] text-foreground-secondary">
              Don't have an account?{" "}
              <Link to={"/auth/register"} className="underline text-logo">
                Register Here
              </Link>
            </span>

            <Button
              icon="noIcon"
              title={loading ? "Logging in..." : "Login"}
              className={"w-full text-center justify-center py-4"}
              onClick={handleLogin}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mobile;
