import React, { useState, useEffect } from "react";
import Background from "../../Login/components/Background";
import Logo from "@/components/Logo";
import { Button } from "@/components/Button";
import Input from "../../Login/components/Input";
import SuccessMsg from "../../Success-msg/SuccessMsg";
import PasswordRule from "../../Registration/components/PasswordRule";

const NewPassword = ({ email, otp, success }) => {
  const [pass, setPass] = useState("");
  const [cPass, setCPass] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [status, setStatus] = useState("");

  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordFocusedOnce, setPasswordFocusedOnce] = useState(false);
  const [passwordValidationDismissed, setPasswordValidationDismissed] =
    useState(false);

  const passwordRules = {
    length: pass.length >= 8,
    uppercase: /[A-Z]/.test(pass),
    number: /\d/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  useEffect(() => {
    if (!isPasswordValid) {
      setPasswordValidationDismissed(false);
    }
  }, [isPasswordValid]);

  const showPasswordValidation =
    !passwordValidationDismissed && (passwordFocusedOnce || passwordFocused);

  const handleChange = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!pass || !cPass) {
      setErrorMsg("Please fill in both fields.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg("Password does not meet the requirements.");
      return;
    }

    if (pass !== cPass) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          email,
          new_password: pass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      setSuccessMsg("Password has been changed successfully!");
      setStatus(data.status);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "success") {
    return <SuccessMsg type={success} />;
  }

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
            <p className="font-montserrat font-bold text-[32px] text-center bg-linear-to-t from-[#949494] to-[#FAFAFA] bg-clip-text text-transparent w-[70%] md:text-[48px] md:w-[50%]">
              New Password
            </p>
            <p className="text-center text-foreground-secondary mt-3 px-4 md:text-[20px]">
              Enter your new password for{" "}
              <span className="font-semibold">{email}</span>
            </p>
          </div>
        </div>

        <div
          id="body-section"
          className="flex flex-col w-full py-9 bg-white/5 px-3 gap-8 rounded-[12px] mt-8 md:w-[75%] md:px-12"
        >
          <div className="flex flex-col gap-6">
            <Input
              placeholder="********"
              title="New password"
              value={pass}
              type="password"
              onChange={(e) => setPass(e.target.value)}
              onFocus={() => {
                setPasswordFocused(true);
                setPasswordFocusedOnce(true);
              }}
              onBlur={() => {
                setPasswordFocused(false);
                if (isPasswordValid) {
                  setPasswordValidationDismissed(true);
                }
              }}
              autoComplete="new-passwordya"
            />

            {showPasswordValidation && (
              <div className="flex flex-col gap-2 text-[14px]">
                <PasswordRule
                  valid={passwordRules.length}
                  label="At least 8 characters"
                />
                <PasswordRule
                  valid={passwordRules.uppercase}
                  label="At least one capital letter"
                />
                <PasswordRule
                  valid={passwordRules.number}
                  label="At least one number"
                />
                <PasswordRule
                  valid={passwordRules.special}
                  label="At least one special character"
                />
              </div>
            )}

            <Input
              placeholder="********"
              title="Confirm password"
              value={cPass}
              type="password"
              onChange={(e) => setCPass(e.target.value)}
            />
            <p
              id="errormsg"
              className={`text-[14px] mt-2 transition-all duration-200 ${
                errorMsg ? "text-red-400 opacity-100" : "opacity-0"
              }`}
            >
              {errorMsg || "Placeholder"}
            </p>
          </div>

          <div className="flex flex-col gap-4 md:gap-8">
            <Button
              icon={loading ? "ri-loader-4-line animate-spin" : "noIcon"}
              title={loading ? "Changing Password..." : "Change Password"}
              className="w-full text-center justify-center py-4"
              onClick={handleChange}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;
