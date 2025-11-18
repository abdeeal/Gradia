import { Search } from "@/components/Search";
import React, { useState } from "react";
import Calendar from "@/pages/Calendar/components/Calendar";
import { useMediaQuery } from "react-responsive";

const Mobile = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  return (
    <div className="flex flex-col gap-8 relative w-full">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="flex flex-col">
            <p className="font-montserrat text-[20px] font-semibold">
              Calendar
            </p>
            <p className="text-foreground-secondary">
              Stay on track every day with your smart calendar.
            </p>
          </div>
          {isTablet ? (
            <Search
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search task title..."
            />
          ) : (
            ""
          )}
        </div>
      </div>
      {!isTablet ? (
        <Search
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search task title..."
        />
      ) : (
        ""
      )}
      <Calendar searchTerm={searchTerm} />
    </div>
  );
};

export default Mobile;
