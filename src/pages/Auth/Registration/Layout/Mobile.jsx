import React, { useState } from "react";
import Background from "../../Login/components/Background";
import Logo from "@/components/Logo";
import Input from "../../Login/components/Input";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import VerifyOtp from "../../Verify-otp/VerifyOtp";

const Mobile = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [expiredAt, setExpiredAt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    setErrorMsg("");

    if (!email || !username || !password) {
      setErrorMsg("Please fill all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, action: "register" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setRegisteredEmail(email);
      setExpiredAt(data.expires_at);
      setShowVerify(true);
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (showVerify) {
    return (
      <VerifyOtp
        email={registeredEmail}
        expiredAt={expiredAt}
        from={"verification"}
      />
    );
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
            <p className="font-montserrat font-bold text-[32px] bg-gradient-to-t from-[#949494] to-[#FAFAFA] bg-clip-text text-transparent md:text-[48px]">
              Let's Register
            </p>
            <p className="text-center text-foreground-secondary mt-3 px-4 md:text-[20px] md:w-[75%]">
              Join Gradia and take control of your goals, time, and mindset —
              all in one app.
            </p>
          </div>
        </div>

        {/* Body section */}
        <div
          id="body-section"
          className="flex-1 flex flex-col w-full py-9 bg-white/5 px-3 gap-4 rounded-[12px] mt-8 justify-between md:w-[75%] md:px-12 md:flex-none"
        >
          <div className="flex flex-col gap-6">
            <Input
              placeholder="youremail@mail.com"
              title="Email"
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Username"
              title="Username"
              value={username}
              type="text"
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              placeholder="********"
              title="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/*Error message */}
            <p
              id="errormsg"
              className={`text-[14px] transition-all duration-300 ${
                errorMsg ? "text-red-400 opacity-100" : "opacity-0"
              }`}
            >
              {errorMsg || " "}
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <span className="text-[14px] text-foreground-secondary">
              Already have an account?{" "}
              <Link to="/auth/login" className="underline text-logo">
                Login Here
              </Link>
            </span>

            <Button
              icon={loading ? "ri-loader-4-line animate-spin" : "noIcon"}
              title={loading ? "Registering..." : "Register"}
              className="w-full text-center justify-center py-4"
              onClick={handleRegister}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mobile;
