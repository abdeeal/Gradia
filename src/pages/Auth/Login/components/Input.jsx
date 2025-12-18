import React from "react";

const Input = ({ title, icon, placeholder, type = "text", value, onChange, ...props }) => {
  return (
    <div className="flex flex-col gap-2">
      <p>{title}</p>
      <input
        type={type}
        name="username"
        value={value}
        onChange={onChange}
        className="w-full border border-border px-2 py-4 rounded-[12px]"
        placeholder={placeholder}
        required
        {...props}
      />
    </div>
  );
};

export default Input;
