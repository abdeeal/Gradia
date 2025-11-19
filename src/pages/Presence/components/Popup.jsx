import React, { useState } from "react";
import Card from "./Card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/Button";

const Popup = ({ data, mode, onClose, onSuccess }) => {
  const [status, setStatus] = useState(data.status || "Present");
  const [note, setNote] = useState(data.note || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const workspaceId = sessionStorage.getItem("id_workspace");
    const body = {
      id_course: data.id_courses,
      presences_at: new Date().toISOString(),
      status,
      note,
      id_workspace : workspaceId,
      ...(mode !== "add" && { id_presence: data.id })
    };

    setLoading(true);

    try {

      const res = await fetch("/api/presences", {
        method: mode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      
      if (res.ok) {
        if (onSuccess) {
          await onSuccess();
          onClose(true)
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed h-dvh w-full bg-black/50 z-[150] left-0 top-0 flex items-center justify-center"
      onClick={() => onClose(false)}
    >
      <div
        className="px-2.5 py-5 bg-background-secondary flex flex-col gap-6 w-[90%] rounded-[12px]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold pl-4">
          {mode === "add" ? "Add Presence" : "Edit Presence"}
        </p>

        <div className="p-4 bg-background w-full rounded-[8px] flex flex-col gap-4">
          <Card
            end={(data.end || "").slice(0, 5)}
            start={(data.start || "").slice(0, 5)}
            room={data.room || "-"}
            sks={data.sks || "-"}
            title={data.course || data.name || "-"}
            className="bg-gradient-to-t from-background to-background border-none px-0 py-0"
            btn={false}
          />

          <div className="flex gap-3">
            <button
              onClick={() => setStatus("Present")}
              className={`relative px-3 py-2 rounded-[8px] cursor-pointer ${
                status === "Present"
                  ? "bg-drop-green text-green pl-8"
                  : "bg-[#7C6F6F]/20"
              }`}
            >
              <i
                className={`ri-check-line absolute left-2 ${
                  status === "Present" ? "opacity-100" : "opacity-0"
                }`}
              ></i>
              Present
            </button>
            <button
              onClick={() => setStatus("Absent")}
              className={`relative px-3 py-2 rounded-[8px] cursor-pointer ${
                status === "Absent"
                  ? "bg-drop-red text-red pl-8"
                  : "bg-[#7C6F6F]/20"
              }`}
            >
              <i
                className={`ri-check-line absolute left-2 ${
                  status === "Absent" ? "opacity-100" : "opacity-0"
                }`}
              ></i>
              Absent
            </button>
          </div>

          <div className="flex flex-col gap-4 mt-3">
            <p className="text-sm text-foreground-secondary">Add Notes</p>
            <Textarea
              className="border px-2 py-1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex w-full justify-end">
            <Button
              className="w-fit flex-row-reverse px-3 mt-4"
              title={
                loading
                  ? mode === "add"
                    ? "Adding..."
                    : "Saving..."
                  : mode === "add"
                  ? "Log presence"
                  : "Update presence"
              }
              icon={
                loading
                  ? "ri-loader-4-line animate-spin"
                  : "ri-login-circle-line"
              }
              onClick={handleSubmit}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
