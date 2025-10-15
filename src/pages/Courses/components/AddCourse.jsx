import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

/**
 * Drawer Add Course
 * Versi Final:
 * - Semua field (termasuk Start/End) punya bg #141414 + border #2c2c2c
 * - Layout, margin, dan font konsisten
 */
const AddCourse = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    title: "",
    alias: "",
    lecturer: "",
    phone: "",
    day: "",
    startTime: "",
    endTime: "",
    room: "",
    sks: "",
    link: "",
  });

  const setVal = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!formData.title?.trim() || !formData.alias?.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Data",
        text: "Please fill Title and Alias.",
        background: "rgba(20,20,20,.9)",
        color: "#fff",
        confirmButtonColor: "#9457FF",
      });
      return;
    }

    const newCourse = {
      ...formData,
      id: Date.now(),
      time: `${formData.startTime || ""} - ${formData.endTime || ""}`.trim(),
    };
    delete newCourse.startTime;
    delete newCourse.endTime;

    if (typeof onAdd === "function") onAdd(newCourse);

    Swal.fire({
      icon: "success",
      title: "Course Added!",
      text: `${newCourse.title || newCourse.alias} has been created.`,
      background: "rgba(20,20,20,.9)",
      color: "#fff",
      confirmButtonColor: "#9457FF",
      customClass: {
        popup: "font-[Montserrat] rounded-2xl py-4 px-6 w-[300px]",
        title: "text-[16px] font-semibold text-white mb-1",
        htmlContainer: "text-sm text-gray-300",
        confirmButton: "text-xs rounded-md px-4 py-1.5 mt-2",
      },
    }).then(onClose);
  };

  return (
    <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
      <button onClick={onClose} className="absolute left-3 top-4 text-gray-400">
        <i className="ri-arrow-right-double-line text-2xl" />
      </button>

      <div className="ml-12 mr-12">
        <Title
          onChange={(v) => setVal("title", v)}
          className="max-w-[473px] mb-12"
        />
      </div>

      <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
        <div className="font-inter text-[14px] space-y-6">
          <InlineField
            label="Alias"
            icon="ri-hashtag"
            onChange={(v) => setVal("alias", v)}
          />
          <InlineField
            label="Lecturer"
            icon="ri-graduation-cap-line"
            onChange={(v) => setVal("lecturer", v)}
          />
          <InlineField
            label="Phone"
            icon="ri-phone-line"
            onChange={(v) => setVal("phone", v)}
          />
          <DayField
            label="Day"
            icon="ri-calendar-event-line"
            onChange={(v) => setVal("day", v)}
          />
          <TimeInline
            label="Start / end"
            onChangeStart={(v) => setVal("startTime", v)}
            onChangeEnd={(v) => setVal("endTime", v)}
          />
          <InlineField
            label="Room"
            icon="ri-door-closed-line"
            onChange={(v) => setVal("room", v)}
          />
          <NumberInline
            label="SKS"
            icon="ri-shopping-bag-line"
            onChange={(v) => setVal("sks", v)}
          />
          <InlineField
            label="Link"
            icon="ri-share-box-line"
            onChange={(v) => setVal("link", v)}
          />
        </div>

        <div className="mt-auto flex justify-end items-center gap-3 pt-8 font-inter fixed bottom-12 right-12">
          <button className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] cursor-pointer transition-all">
            <i className="ri-add-line text-foreground text-[18px]" />
            <span className="text-[15px] font-medium">Add Course</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===== Title ===== */
const Title = ({ value, onChange, className = "" }) => (
  <div className={`font-inter ${className}`}>
    <textarea
      rows={2}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent outline-none resize-none text-[48px] font-bold no-scrollbar"
      placeholder="Enter your course title"
    />
  </div>
);

const InlineField = ({ icon, label, value, onChange, rightAdornment }) => (
  <div className="flex items-center gap-3 group">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 max-w-[360px] flex items-center">
      <input
        className="w-full bg-transparent outline-none font-medium"
        placeholder="Not set"
      />
      {rightAdornment}
    </div>
  </div>
);

const DayField = ({ icon, label, value, onChange }) => {
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  return (
    <div className="flex items-center gap-3 group">
      {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
      <span className="w-32 text-gray-400">{label}</span>
      <div className="flex-1 max-w-[360px] flex items-center">
        <SelectUi placeholder={"Select a day"}>
          <SelectLabel>Day</SelectLabel>
          {dayOrder.map((item, idx) => (
            <SelectItem key={idx} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectUi>
      </div>
    </div>
  );
};

const NumberInline = ({ icon, label, value, onChange }) => (
  <div className="flex items-center gap-3 group w-fit">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 w-fit">
      <SelectUi
        placeholder="1"
        valueClassFn={(val) => {
          if (val === 2) return "bg-drop-yellow text-yellow px-3";
          if (val === 1) return "bg-drop-cyan text-cyan px-3";
          return "bg-drop-red text-red px-3";
        }}
      >
        <SelectLabel>SKS</SelectLabel>
        {[1, 2, 3].map((sks) => (
          <SelectItem key={sks} value={sks}>
            {sks}
          </SelectItem>
        ))}
      </SelectUi>
    </div>
  </div>
);

const TimeInline = ({ label, start, end, onChangeStart, onChangeEnd }) => (
  <div className="flex items-center gap-3 group">
    <i className="ri-time-line text-gray-400 text-[16px]" />
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="time"
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-[72px]"
      />
      <span className="text-gray-500">/</span>
      <input
        type="time"
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-[72px]"
      />
    </div>
  </div>
);

export default AddCourse;
