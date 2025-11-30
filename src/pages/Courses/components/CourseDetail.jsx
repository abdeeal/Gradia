import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import { useAlert } from "@/hooks/useAlert";
import DeletePopup from "@/components/Delete";

const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const CourseDetail = ({ course, onClose, onSave, onDelete }) => {
  const { showAlert } = useAlert();
  const [form, setForm] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!course) return;
    const [s, e] = (course.time || "").split(" - ");
    setForm({
      ...course,
      startTime: (s || "").trim(),
      endTime: (e || "").trim(),
    });
  }, [course]);

  if (!course) return null;

  const setField = (key, val) =>
    setForm((prev) => ({
      ...prev,
      [key]: val,
    }));

  /* =========================
     SAVE — tutup drawer otomatis jika sukses
     ========================= */
  const handleSave = async () => {
    const updated = {
      ...form,
      sks: form.sks ? Number(form.sks) : 0,
      time: `${form.startTime || ""} - ${form.endTime || ""}`.trim(),
    };
    delete updated.startTime;
    delete updated.endTime;

    try {
      setLoading(true);
      if (typeof onSave === "function") {
        await onSave(updated); // tunggu (ke backend di Courses.jsx)
      }

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Updated",
        desc: `${updated.title} updated successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      onClose?.(); // tutup drawer setelah sukses
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
      course?.id_courses ??
      course?.id_course ??
      course?.id ??
      course?.course_id;

    try {
      setLoading(true);

      // Event opsional ke global listener
      window.dispatchEvent(
        new CustomEvent("courses:deleted", {
          detail: { id_courses: courseId },
        })
      );

      // 🔥 Serahkan delete API ke parent (Courses.jsx)
      if (typeof onDelete === "function") {
        await onDelete(courseId);
      }

      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Deleted",
        desc: `Course "${course.title}" has been deleted successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      onClose?.(); // tutup drawer setelah sukses delete
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
          className="absolute left-3 top-4 text-gray-400 cursor-pointer"
          disabled={loading}
        >
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        <div className="ml-12 mr-12">
          <Title
            value={form.title}
            onChange={(v) => setField("title", v)}
            className="max-w-[473px] mb-12"
          />
        </div>

        <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
          <div className="font-inter text-[14px] space-y-6">
            <InlineField
              label="Alias"
              icon="ri-hashtag"
              value={form.alias}
              onChange={(v) => setField("alias", v)}
            />
            <InlineField
              label="Lecturer"
              icon="ri-graduation-cap-line"
              value={form.lecturer}
              onChange={(v) => setField("lecturer", v)}
            />
            <InlineField
              label="Phone"
              icon="ri-phone-line"
              value={form.phone}
              onChange={(v) => setField("phone", v)}
              rightAdornment={
                form.phone ? (
                  <a
                    href={`https://wa.me/${(form.phone || "").replace(
                      /[^0-9]/g,
                      ""
                    )}`}
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
              value={form.day}
              onChange={(v) => setField("day", v)}
            />
            <TimeInline
              label="Start / end"
              start={form.startTime}
              end={form.endTime}
              onChangeStart={(v) => setField("startTime", v)}
              onChangeEnd={(v) => setField("endTime", v)}
            />
            <InlineField
              label="Room"
              icon="ri-door-closed-line"
              value={form.room}
              onChange={(v) => setField("room", v)}
            />
            <NumberInline
              label="SKS"
              icon="ri-shopping-bag-line"
              value={form.sks}
              onChange={(v) => setField("sks", v)}
            />
            <InlineField
              label="Link"
              icon="ri-share-box-line"
              value={form.link}
              onChange={(v) => setField("link", v)}
              rightAdornment={
                form.link?.startsWith("https://") ? (
                  <a
                    href={form.link}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <i className="ri-share-forward-line text-xl text-gray-400" />
                  </a>
                ) : null
              }
            />
          </div>

          <div className="mt-[24px] flex justify-end items-center gap-3 pt-8 font-inter">
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-[44px] h-[44px] rounded-lg bg-[#830404] hover:bg-[#9b0a0a] shadow-md shadow-red-900/40 transition-all disabled:opacity-60 cursor-pointer"
              disabled={loading}
              aria-label="Delete Course"
              title="Delete Course"
            >
              <i className="ri-delete-bin-2-line text-foreground text-[20px]" />
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-[44px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] cursor-pointer transition-all disabled:opacity-60 cursor-pointer"
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

/* ===== Sub components ===== */

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
        value={value === "" || value == null ? undefined : String(value)}
        onValueChange={(val) => onChange(Number(val))}
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

/* ===== PropTypes ===== */

CourseDetail.propTypes = {
  course: PropTypes.shape({
    id_courses: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id_course: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    course_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    alias: PropTypes.string,
    lecturer: PropTypes.string,
    phone: PropTypes.string,
    day: PropTypes.string,
    time: PropTypes.string,
    room: PropTypes.string,
    sks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    link: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
};

Title.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

InlineField.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  rightAdornment: PropTypes.node,
};

DayField.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

NumberInline.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};

TimeInline.propTypes = {
  label: PropTypes.string.isRequired,
  start: PropTypes.string,
  end: PropTypes.string,
  onChangeStart: PropTypes.func.isRequired,
  onChangeEnd: PropTypes.func.isRequired,
};

export default CourseDetail;
