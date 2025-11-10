import React from "react";

const Card = ({ title, children, className }) => {
  return (
    <div className={`px-4 py-5 text-foreground flex flex-col gap-6 border border-border/50 rounded-2xl bg-gradient-to-t from-[#141414] to-[#070707] ${className}`}>
      <p className="font-semibold text-[20px]">{title}</p>
      {children}
    </div>
  );
};

export default Card;
