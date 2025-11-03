import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const CourseDetail = ({ course, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!course) return;
    const [s, e] = (course.time || "").split(" - ");
    setFormData({
      ...course,
      startTime: (s || "").trim(),
      endTime: (e || "").trim(),
    });
  }, [course]);

  if (!course) return null;

  const setVal = (k, v) => setFormData((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    const updated = {
      ...formData,
      sks: formData.sks ? Number(formData.sks) : 0,
      time: `${formData.startTime || ""} - ${formData.endTime || ""}`.trim(),
    };
    delete updated.startTime;
    delete updated.endTime;

    if (typeof onSave === "function") onSave(updated);

    Swal.fire({
      icon: "success",
      title: "Changes saved!",
      text: `${updated.title} updated successfully.`,
      background: "rgba(20,20,20,.9)",
      color: "#fff",
      confirmButtonColor: "#9457FF",
      customClass: {
        popup: "font-[Montserrat] rounded-2xl py-4 px-6 w-[300px]",
        title: "text-[16px] font-semibold text-foreground mb-1",
        htmlContainer: "text-sm text-gray-300",
        confirmButton: "text-xs rounded-md px-4 py-1.5 mt-2",
      },
    });
  };

  const doDelete = async () => {
    try {
      const res = await fetch(`/api/courses?id=${course.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete course");
      if (typeof onDelete === "function") onDelete(course.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = () => {
    Swal.fire({
      icon: "warning",
      title: "Delete this course?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#830404",
      cancelButtonColor: "#6b7280",
      background: "rgba(20,20,20,.9)",
      color: "#fff",
    }).then((r) => {
      if (r.isConfirmed) {
        doDelete().then(() =>
          Swal.fire({
            icon: "success",
            title: "Course deleted!",
            background: "rgba(20,20,20,.9)",
            color: "#fff",
            confirmButtonColor: "#9457FF",
          }).then(onClose)
        );
      }
    });
  };

  return (
    <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
      <button onClick={onClose} className="absolute left-3 top-4 text-gray-400">
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
            rightAdornment={
              formData.phone ? (
                <a
                  href={`https://wa.me/${(formData.phone || "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <i className="ri-whatsapp-line text-xl text-gray-400" />
                </a>
              ) : null
            }
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
            rightAdornment={
              formData.link?.startsWith("https://") ? (
                <a href={formData.link} target="_blank" rel="noreferrer" className="shrink-0">
                  <i className="ri-share-forward-line text-xl text-gray-400" />
                </a>
              ) : null
            }
          />
        </div>

        <div className="mt-auto flex justify-end items-center gap-3 pt-8 font-inter fixed bottom-12 right-12">
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-[44px] h-[44px] rounded-lg bg-[#830404] hover:bg-[#9b0a0a] shadow-md shadow-red-900/40 transition-all"
          >
            <i className="ri-delete-bin-2-line text-foreground text-[20px]" />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] cursor-pointer transition-all"
          >
            <i className="ri-edit-line text-foreground text-[18px]" />
            <span className="text-[15px] font-medium">Save changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Title = ({ value, onChange, className = "" }) => (
  <div className={`font-inter ${className}`}>
    <textarea
      rows={2}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent outline-none resize-none text-[48px] font-bold no-scrollbar"
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
        placeholder="Select a day"
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
        value={value === "" || value == null ? undefined : String(value)}
        onValueChange={(v) => onChange(Number(v))}
        valueClassFn={(val) => {
          const n = Number(val);
          if (n === 2) return "bg-drop-yellow text-yellow px-3";
          if (n === 1) return "bg-drop-cyan text-cyan px-3";
          return "bg-drop-red text-red px-3";
        }}
      >
        <SelectLabel>SKS</SelectLabel>
        {["1", "2", "3"].map((s) => (
          <SelectItem key={s} value={s}>
            {s}
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
        value={start || ""}
        onChange={(e) => onChangeStart(e.target.value)}
        className="bg-transparent outline-none font-medium w-[96px]"
      />
      <span className="text-gray-500">/</span>
      <input
        type="time"
        value={end || ""}
        onChange={(e) => onChangeEnd(e.target.value)}
        className="bg-transparent outline-none font-medium w-[96px]"
      />
    </div>
  </div>
);

export default CourseDetail;
