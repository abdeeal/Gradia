// 📄 CourseDetail.jsx
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import React, { useEffect, useState } from "react";
import { useAlert } from "@/hooks/useAlert";
import DeletePopup from "@/components/Delete";
import axios from "axios";

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const CourseDetail = ({ course, onClose, onSave, onDelete }) => {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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

  /* =========================
     SAVE — tutup drawer otomatis jika sukses
     ========================= */
  const handleSave = async () => {
    const updated = {
      ...formData,
      sks: formData.sks ? Number(formData.sks) : 0,
      time: `${formData.startTime || ""} - ${formData.endTime || ""}`.trim(),
    };
    delete updated.startTime;
    delete updated.endTime;

    try {
      setLoading(true);
      if (typeof onSave === "function") {
        await onSave(updated); // tunggu (bisa ke backend)
      }

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Updated",
        desc: `${updated.title} updated successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      onClose?.(); // <- tutup drawer setelah sukses
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to update course. Please try again.";
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: msg,
        variant: "destructive",
        width: 676,
        height: 380,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE — buka popup, eksekusi, tutup drawer kalau sukses
     ========================= */
  const handleDelete = () => setShowConfirm(true);

  const doDelete = async () => {
    const courseId =
      course?.id_courses ?? course?.id_course ?? course?.id ?? course?.course_id;

    try {
      setLoading(true);

      // Optimistic event (opsional)
      window.dispatchEvent(
        new CustomEvent("courses:deleted", { detail: { id_course: courseId } })
      );

      await axios.delete(`/api/courses?id=${courseId}`);

      if (typeof onDelete === "function") onDelete(courseId);

      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Deleted",
        desc: `Course "${course.title}" has been deleted successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      onClose?.(); // <- tutup drawer setelah sukses delete
    } catch (e) {
      console.error(e);
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to delete course. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
    } finally {
      setShowConfirm(false);
      setLoading(false);
    }
  };

  return (
    <>
      <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
        <button
          onClick={onClose}
          className="absolute left-3 top-4 text-gray-400"
          disabled={loading}
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

          <div className="mt-[24px] flex justify-end items-center gap-3 pt-8 font-inter">
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-[44px] h-[44px] rounded-lg bg-[#830404] hover:bg-[#9b0a0a] shadow-md shadow-red-900/40 transition-all disabled:opacity-60"
              disabled={loading}
              aria-label="Delete Course"
              title="Delete Course"
            >
              <i className="ri-delete-bin-2-line text-foreground text-[20px]" />
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] cursor-pointer transition-all disabled:opacity-60"
              disabled={loading}
            >
              <i className="ri-edit-line text-foreground text-[18px]" />
              <span className="text-[15px] font-medium">
                {loading ? "Saving..." : "Save changes"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <DeletePopup
          title="Delete Course"
          warning={`Are you sure you want to delete "${course.title}"?`}
          onCancel={() => setShowConfirm(false)}
          onDelete={doDelete}
        />
      )}
    </>
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
      <SelectUi placeholder={"Select a day"} value={value || undefined} onValueChange={onChange}>
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
        value={start || ""}
        type="time"
        onChange={(e) => onChangeStart(e.target.value)}
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-[96px]"
      />
      <span className="text-gray-500">/</span>
      <input
        value={end || ""}
        type="time"
        onChange={(e) => onChangeEnd(e.target.value)}
        placeholder="HH:MM"
        className="bg-transparent outline-none font-medium w-[96px]"
      />
    </div>
  </div>
);

export default CourseDetail;
