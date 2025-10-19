import React from "react";
import { useMediaQuery } from "react-responsive";

const Category = ({ icon, iconBg, title, children, isOpen, onToggle }) => {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="flex justify-between w-full items-center py-5 px-2 bg-background rounded-[8px]"
      >
        <div className="flex items-center gap-3 md:w-full md:justify-between md:flex-row-reverse">
          <div
            className={`w-[25px] aspect-square ${iconBg} rounded-[4px] flex items-center justify-center`}
          >
            <i className={`${icon} text-[17px]`}></i>
          </div>
          <p className="font-semibold">{title}</p>
        </div>
        <div className="w-[25px] aspect-square bg-[#6B7280]/20 rounded-[4px] flex items-center justify-center md:hidden">
          <i
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
            className="ri-arrow-down-s-fill text-[17px] transition-transform duration-200"
          ></i>
        </div>
      </button>

      {(isOpen || isTablet) && (
        <div className="flex flex-col gap-3 mt-2 animate-fadeIn">
          {children}
        </div>
      )}
    </>
  );
};

export default Category;
