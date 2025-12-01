import { navAuth, navLanding } from "@/constants/data";
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className="w-full py-3 flex flex-col px-6 gap-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between md:border-b md:border-white/50 md:pb-6">
        <Link
          to="/"
          onClick={() => setDrawer(false)}
          className="z-[100] text-white"
        >
          <p className="font-genos font-bold text-[36px]">
            <span className="text-logo">GRA</span>DIA
          </p>
        </Link>
        <div className="flex gap-4 font-montserrat border-b md:border-none border-white/50 pb-4 font-semibold md:gap-16 md:pt-3 pt-6">
          {navLanding.map((item, idx) => (
            <a key={idx} href={item.href}>
              {item.name}
            </a>
          ))}
          {navAuth.map((item, idx) => (
            <a key={idx} href={item.href}>
              {item.name}
            </a>
          ))}
        </div>
      </div>
      <span className="text-foreground-secondary -mt-2">
        {" "}
        © {new Date().getFullYear()} Gradia. All rights reserved.
      </span>
    </div>
  );
};

export default Footer;
