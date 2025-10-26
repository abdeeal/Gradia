import React, { useState } from "react";
import Card from "./Card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/Button";

const Popup = ({ data, onClose }) => {
  if (!data) return null;

  const [status, setStatus] = useState("Present");

  const handlerClick = (s) => {
    if (s == "Present") {
      setStatus("Present");
    } else {
      setStatus("Absent");
    }
  };
  return (
    <div
      className="fixed h-dvh w-full bg-black/50 z-[150] left-0 top-0 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="px-2.5 py-5 bg-background-secondary flex flex-col gap-6 w-[90%] rounded-[12px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold">Log Presence</p>
        <div className="p-4 bg-background w-full rounded-[8px] flex flex-col gap-4">
          <Card
            end={data.end.slice(0, 5) || "-"}
            start={data.start.slice(0, 5) || "-"}
            room={data.room || "-"}
            sks={data.sks || "-"}
            title={data.course || "-"}
            className={
              "bg-gradient-to-t from-background to-background border-none px-0 py-0"
            }
            btn={false}
          />
          <div className="flex gap-3">
            <button
              onClick={() => handlerClick("Present")}
              className={`relative px-3 py-2 bg-[#7C6F6F]/20 rounded-[8px] cursor-pointer flex items-center justify-center transition-all duration-300 ${
                status === "Present" ? "bg-drop-green text-green pl-8" : ""
              }`}
            >
              <i
                className={`ri-check-line absolute left-2 transition-all duration-300 ${
                  status === "Present"
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2"
                }`}
              ></i>
              Present
            </button>

            <button
              onClick={() => handlerClick("Absent")}
              className={`relative px-3 py-2 bg-[#7C6F6F]/20 rounded-[8px] cursor-pointer flex items-center justify-center transition-all duration-300 ${
                status === "Absent" ? "bg-drop-red text-red pl-8" : ""
              }`}
            >
              <i
                className={`ri-check-line absolute left-2 transition-all duration-300 ${
                  status === "Absent"
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2"
                }`}
              ></i>
              Absent
            </button>
          </div>

          <div className="flex flex-col gap-4 mt-3">
            <p className="text-sm text-foreground-secondary">Add Notes</p>
            <Textarea
              className={"border px-2 py-1"}
              defaultValue={data.note || ""}
            />
          </div>

          <div className="flex w-full justify-end">
            <Button
              className={"w-fit flex-row-reverse px-3 mt-4"}
              title="Log presence"
              icon="ri-login-circle-line"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
