import React, { useLayoutEffect, useRef } from "react";

const AutoTextarea = ({
  defaultValue = "",
  name,
  className = "",
  placeholder,
  size = "sm",
}) => {
  const textareaRef = useRef(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    resize();
  }, [defaultValue]);

  const handleInput = (e) => {
    resize();
  };

  const baseProps = {
    name,
    ref: textareaRef,
    defaultValue: defaultValue.trimEnd(), // 🔥 Hapus newline di akhir
    placeholder,
    onInput: handleInput,
  };

  if (size === "sm") {
    return (
      <textarea
        {...baseProps}
        className={`w-full resize-none overflow-hidden focus:outline-none transition-[height] duration-150 ease-in-out p-0 ${className}`}
        style={{  padding: 0 }}
      />
    );
  }

  return (
    <textarea
      {...baseProps}
      className={`font-bold text-[48px] focus:ring-0 focus:outline-none focus:border-none max-w-full w-full resize-none overflow-hidden transition-[height] duration-150 ease-in-out ${className}`}
      style={{
        padding: 0,
        margin: 0,
        height: "auto",
      }}
    />
  );
};

export default AutoTextarea;
