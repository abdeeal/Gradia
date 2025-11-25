import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import React, { useState } from "react";
import { useAlert } from "@/hooks/useAlert";

/**
 * Drawer Add Course
 * Semua field controlled, mapping sesuai API.
 */
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const AddCourse = ({ onClose, onAdd }) => {
  const { showAlert } = useAlert();

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

  const [submitting, setSubmitting] = useState(false);

  const setVal = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!formData.title?.trim() || !formData.alias?.trim()) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Incomplete Data",
        desc: "Please fill Title and Alias.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      return;
    }

    // Susun payload untuk API (id_workspace ditambah di toApiCourse / Courses.jsx)
    const newCourse = {
      ...formData,
      sks: formData.sks ? Number(formData.sks) : 0,
      time: `${formData.startTime || ""} - ${
        formData.endTime || ""
      }`.trim(),
      // id_courses auto di DB, id_workspace akan ditambahkan di toApiCourse (Courses.jsx)
    };

    if (submitting) return;
    setSubmitting(true);

    try {
      if (typeof onAdd === "function") {
        await onAdd(newCourse);
      }

      // Sukses → alert + tutup drawer
      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Success",
        desc: `${newCourse.title || newCourse.alias} has been created.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      onClose?.();
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to create course. Please try again.";
      showAlert({
        icon: "ri-close-circle-fill",
        title: "Failed",
        desc: msg,
        variant: "destructive",
        width: 676,
        height: 380,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
      <button
        onClick={onClose}
        className="absolute left-3 top-4 text-gray-400 cursor-pointer"
        disabled={submitting}
      >
        <i className="ri-arrow-right-double-line text-2xl" />
      </button>

      <div className="ml-12 mr-12">
        <Title
          value={formData.title}
          onChange={(v) => setVal("title", v)}
          className="max-w-[473px] mb-12"
        />
      </div>

      <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
        <div className="font-inter text-[14px] space-y-6">
          <InlineField
            label="Alias"
            icon="ri-hashtag"
            value={formData.alias}
            onChange={(v) => setVal("alias", v)}
          />
          <InlineField
            label="Lecturer"
            icon="ri-graduation-cap-line"
            value={formData.lecturer}
            onChange={(v) => setVal("lecturer", v)}
          />
          <InlineField
            label="Phone"
            icon="ri-phone-line"
            value={formData.phone}
            onChange={(v) => setVal("phone", v)}
          />
          <DayField
            label="Day"
            icon="ri-calendar-event-line"
            value={formData.day}
            onChange={(v) => setVal("day", v)}
          />
          <TimeInline
            label="Start / end"
            start={formData.startTime}
            end={formData.endTime}
            onChangeStart={(v) => setVal("startTime", v)}
            onChangeEnd={(v) => setVal("endTime", v)}
          />
          <InlineField
            label="Room"
            icon="ri-door-closed-line"
            value={formData.room}
            onChange={(v) => setVal("room", v)}
          />
          <NumberInline
            label="SKS"
            icon="ri-shopping-bag-line"
            value={formData.sks}
            onChange={(v) => setVal("sks", v)}
          />
          <InlineField
            label="Link"
            icon="ri-share-box-line"
            value={formData.link}
            onChange={(v) => setVal("link", v)}
          />
        </div>

        <div className="mt-auto flex justify-end items-center gap-3 pt-8 font-inter fixed bottom-12 right-12">
          <button
            onClick={handleAdd}
            disabled={submitting}
            className={`flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] cursor-pointer transition-all ${
              submitting ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <i className="ri-add-line text-foreground text-[18px]" />
            <span className="text-[15px] font-medium">
              {submitting ? "Adding..." : "Add Course"}
            </span>
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
      value={value || ""}
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
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none font-medium"
        placeholder="Not set"
      />
      {rightAdornment}
    </div>
  </div>
);

const DayField = ({ icon, label, value, onChange }) => (
  <div className="flex items-center gap-3 group">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 max-w-[360px] flex items-center">
      <SelectUi
        placeholder={"Select a day"}
        value={value || undefined}
        onValueChange={onChange}
      >
        <SelectLabel>Day</SelectLabel>
        {dayOrder.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectUi>
    </div>
  </div>
);

const NumberInline = ({ icon, label, value, onChange }) => (
  <div className="flex items-center gap-3 group w-fit">
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400">{label}</span>
    <div className="flex-1 w-fit">
      <SelectUi
        placeholder="1"
        value={value === "" ? undefined : String(value)}
        onValueChange={(v) => onChange(Number(v))}
        valueClassFn={(val) => {
          const num = Number(val);
          if (num === 2) return "bg-drop-yellow text-yellow px-3";
          if (num === 1) return "bg-drop-cyan text-cyan px-3";
          return "bg-drop-red text-red px-3";
        }}
      >
        <SelectLabel>SKS</SelectLabel>
        {[1, 2, 3].map((sks) => (
          <SelectItem key={sks} value={String(sks)}>
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
        className="bg-transparent outline-none font-medium w-[96px]"
        value={start || ""}
        onChange={(e) => onChangeStart(e.target.value)}
      />
      <span className="text-gray-500">/</span>
      <input
        type="time"
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-[96px]"
        value={end || ""}
        onChange={(e) => onChangeEnd(e.target.value)}
      />
    </div>
  </div>
);

export default AddCourse;
