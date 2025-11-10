import React from "react";

export const Button = ({ variant = "main", icon = "ri-add-line", title = 'Add courses', className, ...props }) => {
  let button;
  switch (variant) {
    case "sort":
      button = (  
        <button
          type="button"
          {...props}
          className={`border border-border text-border p-2 rounded-[8px] gap-3 flex cursor-pointer ${className}`}
        >
          {icon == "noIcon" ? "" : <i className="ri-sort-desc text-[18px]"></i>}
          <span className="text-foreground-secondary">Sort</span>
        </button>
      );
      break;
    case "filter":
      button = (
        <button
          type="button"
          {...props}
          className={`border border-border text-border p-2 rounded-[8px] gap-3 flex cursor-pointer ${className}`}
        >
          {icon == "noIcon" ? "" : <i className="ri-filter-3-line text-[18px]"></i>}
          <span className="text-foreground-secondary">Filter</span>
        </button>
      );
      break;
    case "main":
      button = (
        <button
          type="button"
          {...props}
          className={`p-2 cursor-pointer rounded-[8px] gap-3 flex text-foreground bg-gradient-to-br from-[#34146C] to-[#28073B] items-center ${className}`}
        >
          {icon == "noIcon" ? "" : <i className={`${icon} text-[18px]`}></i>}
          {title == "noText" ? "" : <span>{title}</span>}
        </button>
      );
      break;
    default:
      button = null;
  }

  return button;
};
