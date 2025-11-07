import React, { useRef, useState } from "react";

const OtpInput = ({ length = 6, onChange }) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);

  const handleChange = (e, idx) => {
    const value = e.target.value.replace(/\D/, ""); // hanya angka
    if (!value) return;

    const newOtp = [...otp];
    newOtp[idx] = value[value.length - 1];
    setOtp(newOtp);
    onChange?.(newOtp.join(""));

    if (idx < length - 1) {
      inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (otp[idx] === "") {
        if (idx > 0) inputRefs.current[idx - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[idx] = "";
        setOtp(newOtp);
        onChange?.(newOtp.join(""));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "");
    const newOtp = [...otp];
    for (let i = 0; i < length; i++) {
      newOtp[i] = pasteData[i] || "";
    }
    setOtp(newOtp);
    onChange?.(newOtp.join(""));
  };

  return (
    <div
      className="grid grid-cols-6 gap-2"
      onPaste={handlePaste}
    >
      {otp.map((digit, idx) => (
        <input
          key={idx}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onFocus={(e) => e.target.select()}
          ref={(el) => (inputRefs.current[idx] = el)}
          className={`w-full aspect-square text-center text-xl font-semibold rounded-[8px] border outline-none transition-all 
            ${digit ? "text-white" : "text-foreground-secondary"} 
            focus:ring-2 focus:ring-border border-border bg-transparent`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
