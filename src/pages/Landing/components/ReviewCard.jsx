import React from "react";

const ReviewCard = ({person, img, univ, text, height}) => {
  return (
    <div className={`flex flex-col w-full bg-white/10 border border-border rounded-[4px] ${height}`}>
      <div className="flex gap-3 border-b border-border py-3 px-6 items-center">
        <img src={img} alt="profile1" />
        <div className="flex flex-col">
          <p className="text-[20px] font-semibold">{person}</p>
          <span className="text-foreground-secondary text-xs">
            {univ}
          </span>
        </div>
      </div>
      <div className="flex justify-center items-center text-xs text-foreground-secondary text-center px-8 py-1.5 flex-1">
        {text}
      </div>
    </div>
  );
};

export default ReviewCard;
