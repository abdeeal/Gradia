import React from "react";

const colorMap = {
  yellow: {
    bg: "bg-drop-yellow",
    text: "text-yellow",
  },
  green: {
    bg: "bg-drop-green",
    text: "text-green",
  },
  blue: {
    bg: "bg-drop-blue",
    text: "text-blue",
  },
  red: {
    bg: "bg-drop-red",
    text: "text-red",
  },
  cyan: {
    bg: "bg-drop-cyan",
    text: "text-cyan",
  },
  gray: {
    bg: "bg-drop-gray",
    text: "text-gray",
  },
};

const Badges = ({ color = "yellow", title, className=" " }) => {
  const classes = colorMap[color] || colorMap.yellow;

  return (
    <div className={`px-2 rounded-[4px] ${classes.bg} ${className}`}>
      <p className={`${classes.text}`}>{title}</p>
    </div>
  );
};

export default Badges;
