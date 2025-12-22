import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import gsap from "gsap";
import { useAlert } from "@/hooks/useAlert";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import DeletePopup from "@/components/Delete";
import { getWorkspaceId } from "@/components/GetWorkspace";

/* ---------- Helpers: date/time ---------- */
/**
 * toDateInput
 * Fungsi untuk mengubah nilai tanggal (Date/ISO/string) menjadi format yang cocok untuk input type="date" (YYYY-MM-DD).
 * Dipakai untuk:
 * - mengisi default value field deadline pada form saat buka TaskDetail
 * - memastikan data dari API/task bisa langsung masuk ke input date
 */
const toDateInput = (d) => {
  if (!d) return "";
  if (typeof d === "string" && d.includes("-")) return d.slice(0, 10);
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
};

/**
 * toTimeInput
 * Fungsi untuk mengubah nilai waktu dari deadline (Date/ISO) menjadi format input type="time" (HH:mm).
 * Aturan:
 * - kalau fallbackTime ada (misalnya task.time), itu dipakai langsung
 * - kalau tidak ada, coba ambil jam & menit dari deadline
 * Dipakai untuk:
 * - mengisi default value field time pada form
 */
const toTimeInput = (d, fallbackTime) => {
  if (fallbackTime) return fallbackTime;
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

/**
 * formatDateDDMMYYYY
 * Fungsi untuk mengubah format ISO date (YYYY-MM-DD) menjadi tampilan dd/mm/yyyy untuk mode "view" (bukan edit).
 * Dipakai ketika field deadline tidak sedang diedit (editingKey !== "deadline_time").
 */
const formatDateDDMMYYYY = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

/**
 * wait
 * Fungsi helper untuk delay berbasis Promise.
 * Dipakai untuk:
 * - menahan minimal durasi loading (misalnya minimal 1 detik) agar UX tidak "kedip" terlalu cepat
 * - sinkronisasi UI saat fetch/save/delete
 */
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/* ---------- Title (2 baris) ---------- */
/**
 * Title
 * Komponen judul task (maks 2 baris).
 * Mode:
 * - editable = false: tampil sebagai text (read mode) dengan placeholder jika kosong
 * - editable = true : tampil sebagai textarea untuk edit judul
 * Perilaku penting:
 * - onBlur memanggil onFocusOut untuk keluar dari mode edit
 * - Enter tanpa Shift akan mengakhiri edit (submit/close edit), sedangkan Shift+Enter membuat baris baru
 */
const Title = ({ value, onChange, className, editable, onFocusOut }) => {
  if (!editable) {
    return (
      <div className={`font-inter ${className}`}>
        <div
          className="text-[48px] font-bold text-foreground/90 leading-[1.1] break-words min-h-[2.2em]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
          }}
        >
          {value ? (
            value
          ) : (
            <>
              <span className="text-gray-500">Enter Your Task Name</span>
              {"\n"}
              <span>&nbsp;</span>
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={`font-inter ${className}`}>
      <textarea
        rows={2}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onFocusOut}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onFocusOut?.();
          }
        }}
        autoFocus
        placeholder="Enter Your Task Name"
        className="w-full bg-transparent outline-none resize-none text-[48px] font-bold no-scrollbar placeholder:text-gray-500 leading-[1.1] min-h-[2.2em]"
      />
    </div>
  );
};

Title.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  editable: PropTypes.bool,
  onFocusOut: PropTypes.func,
};

Title.defaultProps = {
  value: "",
  className: "",
  editable: false,
  onFocusOut: undefined,
};

/* ---------- Badge Styles ---------- */
/**
 * BADGE_BASE
 * Class dasar untuk badge (priority/status) agar ukuran & typography konsisten di UI.
 */
const BADGE_BASE =
  "inline-flex items-center justify-center h-[30px] rounded-[4px] text-[16px] font-[Montserrat] leading-none w-fit px-2";

/**
 * priorityValueClass
 * Fungsi untuk menentukan className badge berdasarkan nilai priority:
 * - High   => merah
 * - Medium => kuning
 * - Low    => abu
 * Dipakai pada BadgeSelect khusus priority.
 */
const priorityValueClass = (val) => {
  if (val === "High") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (val === "Medium") return `${BADGE_BASE} bg-[#EAB308]/20 text-[#FDE047]`;
  if (val === "Low") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

/* ---------- Status normalizer ---------- */
/**
 * normalizeStatus
 * Fungsi untuk menormalkan teks status agar konsisten meskipun input dari API/user beda penulisan.
 * Contoh:
 * - "inprogress" -> "In progress"
 * - default jika kosong -> "Not started"
 * Dipakai:
 * - set initial state form.status
 * - saat user mengubah status via select
 * - saat build payload save
 */
const normalizeStatus = (s) => {
  const m = String(s || "").trim().toLowerCase();
  if (m === "in progress" || m === "inprogress") return "In progress";
  if (m === "not started" || m === "notstarted") return "Not started";
  if (m === "completed") return "Completed";
  if (m === "overdue") return "Overdue";
  return s || "Not started";
};

/**
 * statusValueClass
 * Fungsi untuk menentukan className badge berdasarkan status (yang sudah dinormalisasi).
 * Dipakai pada BadgeSelect khusus status.
 */
const statusValueClass = (val) => {
  const v = normalizeStatus(val);
  if (v === "In progress") return `${BADGE_BASE} bg-[#083344]/60 text-[#22D3EE]`;
  if (v === "Completed") return `${BADGE_BASE} bg-[#14532D]/60 text-[#4ADE80]`;
  if (v === "Overdue") return `${BADGE_BASE} bg-[#7F1D1D]/60 text-[#F87171]`;
  if (v === "Not started") return `${BADGE_BASE} bg-[#27272A]/60 text-[#D4D4D8]`;
  return BADGE_BASE;
};

/* ---------- Row & Inputs ---------- */
/**
 * Row
 * Komponen layout satu baris field (icon + label + slot isi).
 * Dipakai untuk merapikan tampilan form, sekaligus bisa dibuat clickable (onClick) untuk masuk mode edit per-field.
 */
const Row = ({ icon, label, children, onClick, className }) => (
  <div
    className={`flex items-center gap-3 group h-[30px] ${
      onClick ? "cursor-pointer" : ""
    } ${className}`}
    onClick={onClick}
  >
    {icon && <i className={`${icon} text-gray-400 text-[16px]`} />}
    <span className="w-32 text-gray-400 whitespace-nowrap">{label}</span>
    <div className="flex-1 min-w-0 flex items-center h-[30px]">
      <div className="field-slot w-full h-[30px] flex items-center pl-2">
        {children}
      </div>
    </div>
  </div>
);

Row.propTypes = {
  icon: PropTypes.string,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

Row.defaultProps = {
  icon: undefined,
  onClick: undefined,
  className: "",
};

/**
 * InputBase
 * Komponen input reusable yang menerima "as" untuk menentukan element (input, textarea, dll).
 * Dipakai untuk:
 * - input text (description/link)
 * - input date/time
 * - input number (score)
 * onBlur dipakai untuk keluar dari mode edit per-field.
 */
const InputBase = ({ as: Comp, className, onBlur, ...rest }) => (
  <Comp
    {...rest}
    onBlur={onBlur}
    className={`h-[30px] w-full bg-transparent border-none outline-none text-gray-200 text-[16px] placeholder:text-gray-500 ${className}`}
  />
);

InputBase.propTypes = {
  as: PropTypes.elementType,
  className: PropTypes.string,
  onBlur: PropTypes.func,
};

InputBase.defaultProps = {
  as: "input",
  className: "",
  onBlur: undefined,
};

/**
 * BadgeSelect
 * Komponen wrapper select yang menampilkan value sebagai badge berwarna.
 * Dipakai untuk:
 * - Priority select
 * - Status select
 * Props penting:
 * - valueClassFn menentukan class badge per item/value
 * - placeholder menggunakan value (kalau ada) agar label terlihat sebagai badge
 */
const BadgeSelect = ({ value, onChange, options, valueClassFn, label }) => (
  <div className="flex items-center h-[30px] w-full">
    <SelectUi
      value={value}
      onValueChange={onChange}
      placeholder={value || label}
      className="!w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
      valueClassFn={(val) => valueClassFn(val || value)}
    >
      <SelectLabel className="text-[14px] text-gray-400 font-inter px-2 py-1">
        {label}
      </SelectLabel>
      {options.map((opt) => (
        <SelectItem
          key={opt}
          value={opt}
          className={`text-[16px] font-inter ${
            valueClassFn(opt).match(/text-\[[^ ]+\]|text-[^ ]+/g)?.[0] || ""
          }`}
        >
          {opt}
        </SelectItem>
      ))}
    </SelectUi>
  </div>
);

BadgeSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  valueClassFn: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

BadgeSelect.defaultProps = {
  value: "",
};

/* ---------- Courses helpers ---------- */
/**
 * normalizeCourses
 * Fungsi untuk menyeragamkan struktur data courses dari berbagai sumber response.
 * Output: array of { id_courses, name }
 * Dipakai saat merge course dari props/task/API.
 */
const normalizeCourses = (list = []) =>
  list
    .map((c) => ({
      id_courses:
        c?.id_courses ?? c?.id_course ?? c?.id ?? c?.course_id ?? c?.courseId,
      name:
        c?.name ??
        c?.title ??
        c?.course_name ??
        c?.course?.name ??
        c?.label ??
        null,
    }))
    .filter((c) => c.id_courses && c.name);

/**
 * uniqBy
 * Fungsi untuk menghapus duplikat array berdasarkan key tertentu.
 * Dipakai untuk memastikan daftar courses tidak double ketika digabung dari beberapa sumber.
 */
const uniqBy = (arr, keyFn) => {
  const m = new Map();
  arr.forEach((x) => m.set(keyFn(x), x));
  return Array.from(m.values());
};

/**
 * seedCoursesFromTask
 * Fungsi untuk membuat "seed" course dari data task yang sedang dibuka.
 * Tujuan UX:
 * - agar label/select trigger langsung bisa menampilkan course dari task
 *   walaupun fetch courses dari API belum selesai.
 */
const seedCoursesFromTask = (task) => {
  const id =
    task?.id_course ?? task?.course_id ?? task?.relatedCourse ?? task?.course?.id;
  const name = task?.course?.name ?? task?.relatedCourse ?? task?.course_name;
  if (!id || !name) return [];
  return [{ id_courses: String(id), name }];
};

/* ---------- Main component ---------- */
/**
 * TaskDetail
 * Drawer panel untuk melihat dan mengedit detail task yang sudah ada.
 * Fitur utama:
 * - Edit inline per-field (title/description/deadline/score/link) dengan editingKey
 * - Select priority & status dengan badge
 * - Related course select yang fetch datanya sekali (lazy) dan terkunci sampai siap
 * - Save perubahan via onSave (dari parent)
 * - Delete task via onDelete + popup konfirmasi
 * - Animasi drawer masuk/keluar pakai GSAP
 */
const TaskDetail = ({
  task,
  setDrawer,
  refreshTasks,
  courses: coursesProp,
  onTaskUpdated,
  onTaskDeleted,
  onClose,
  onSave,
  onDelete,
}) => {
  const { showAlert } = useAlert();
  const drawerRef = useRef(null);
  const deadlineEditRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ambil workspace id untuk parameter request API (courses) dan payload save
  const idWorkspace = getWorkspaceId();

  // state form untuk menampung field yang ditampilkan & diedit di UI
  const [form, setForm] = useState({
    id_task: task?.id_task,
    title: task?.title || "",
    description: task?.description || "",
    deadline: toDateInput(task?.deadline) || "",
    time: toTimeInput(task?.deadline, task?.time) || "",
    id_course:
      task?.id_course != null
        ? String(task.id_course)
        : task?.relatedCourse != null
        ? String(task.relatedCourse)
        : null,
    priority: task?.priority || "High",
    status: normalizeStatus(task?.status) || "Not started",
    score: task?.score ?? "",
    link: task?.link || "",
  });

  // editingKey menentukan field mana yang sedang mode edit (inline edit)
  const [editingKey, setEditingKey] = useState(null);

  // state courses untuk dropdown course (seed dari task + dari props)
  const [courses, setCourses] = useState(() => {
    const fromTask = seedCoursesFromTask(task);
    const fromProp = normalizeCourses(coursesProp || []);
    return uniqBy([...fromTask, ...fromProp], (c) => String(c.id_courses));
  });

  // flags kontrol fetch course (agar hanya fetch sekali + bisa tampil loading yang smooth)
  const [coursesFetching, setCoursesFetching] = useState(false);
  const [coursesFetched, setCoursesFetched] = useState(false);
  const [isCourseOpen, setIsCourseOpen] = useState(false);

  /**
   * setVal
   * Helper update field form supaya penulisan setForm lebih ringkas & konsisten.
   * Dipakai di semua onChange field.
   */
  const setVal = (k, v) =>
    setForm((p) => ({
      ...p,
      [k]: v,
    }));

  /* fetchCoursesOnce dibungkus useCallback agar stable untuk useEffect */
  /**
   * fetchCoursesOnce
   * Fungsi untuk fetch list course dari API sekali saja.
   * Guard:
   * - kalau sudah fetched atau sedang fetching -> return
   * Tujuan:
   * - isi dropdown Related Course
   * - merge hasil API dengan course yang sudah ada (seed/props)
   * - memastikan minimal loading 1 detik (pakai wait) agar UI loading tidak kedip
   * Dipanggil:
   * - saat component mount (useEffect)
   * - saat dropdown dibuka (onOpenChange)
   */
  const fetchCoursesOnce = useCallback(async () => {
    if (coursesFetched || coursesFetching) return;
    setCoursesFetching(true);
    const t0 = Date.now();
    try {
      const r = await fetch(
        `/api/courses?idWorkspace=${encodeURIComponent(idWorkspace)}`,
        { cache: "no-store" }
      );
      if (!r.ok) throw new Error("courses request failed");
      const raw = await r.json();
      const list = normalizeCourses(raw);

      setCourses((prev) =>
        uniqBy([...prev, ...list], (c) => String(c.id_courses)).sort((a, b) =>
          String(a.name).localeCompare(String(b.name))
        )
      );

      // jika form.id_course berisi sesuatu yang tidak ada di list id, coba cocokkan by name
      const hasId = list.some(
        (c) => String(c.id_courses) === String(form.id_course)
      );
      if (!hasId && form.id_course) {
        const byName = list.find(
          (c) => String(c.name) === String(form.id_course)
        );
        if (byName) {
          setForm((p) => ({ ...p, id_course: String(byName.id_courses) }));
        }
      }

      setCoursesFetched(true);
    } catch {
      // ignore error, UI sama
    } finally {
      const elapsed = Date.now() - t0;
      if (elapsed < 1000) await wait(1000 - elapsed);
      setCoursesFetching(false);
    }
  }, [
    coursesFetched,
    coursesFetching,
    idWorkspace,
    form.id_course, // dipakai di dalam function
  ]);

  /**
   * useEffect (mount)
   * Memastikan fetchCoursesOnce dipanggil saat awal component tampil,
   * supaya list course tersedia tanpa harus menunggu user membuka dropdown.
   */
  useEffect(() => {
    fetchCoursesOnce();
  }, [fetchCoursesOnce]);

  /**
   * useEffect (task berubah)
   * Ketika user memilih task berbeda:
   * - reset isi form sesuai task baru
   * - reset editingKey (keluar dari mode edit)
   * - seed course dari task baru agar trigger select tetap punya label
   */
  useEffect(() => {
    if (!task) return;
    setForm({
      id_task: task.id_task,
      title: task.title || "",
      description: task.description || "",
      deadline: toDateInput(task.deadline) || "",
      time: toTimeInput(task.deadline, task.time) || "",
      id_course:
        task?.id_course != null
          ? String(task.id_course)
          : task?.relatedCourse != null
          ? String(task.relatedCourse)
          : null,
      priority: task.priority || "High",
      status: normalizeStatus(task.status) || "Not started",
      score: task.score ?? "",
      link: task.link || "",
    });
    setEditingKey(null);
    setCourses((prev) =>
      uniqBy([...prev, ...seedCoursesFromTask(task)], (c) =>
        String(c.id_courses)
      )
    );
  }, [task]);

  /* ---------- GSAP drawer animation ---------- */
  /**
   * useEffect (animasi drawer)
   * Saat drawer muncul:
   * - animasi slide dari kanan (x: 100% -> 0)
   * Saat drawer unmount:
   * - animasi keluar ke kanan (x: 0 -> 100%)
   */
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { x: "100%" },
      { x: 0, duration: 0.5, ease: "power3.out" }
    );

    return () => {
      if (!el) return;
      gsap.to(el, {
        x: "100%",
        duration: 0.4,
        ease: "power2.in",
      });
    };
  }, []);

  /**
   * closeDrawer
   * Fungsi untuk menutup drawer:
   * - prioritas panggil onClose (kalau disediakan parent)
   * - kalau tidak ada, pakai setDrawer(false)
   */
  const closeDrawer = () => {
    if (onClose) onClose();
    else setDrawer?.(false);
  };

  /**
   * handleSave
   * Fungsi untuk menyimpan perubahan task (update).
   * Flow:
   * 1) validasi title tidak boleh kosong
   * 2) pastikan task.id_task ada (TaskDetail bukan tempat create)
   * 3) gabungkan deadline + time jadi ISO
   * 4) build payload sesuai API
   * 5) panggil onSave(payload) (dari parent)
   * 6) jika sukses:
   *    - callback onTaskUpdated(payload) untuk update state parent/optimistic
   *    - tampilkan alert success
   *    - keluar dari mode edit + tutup drawer
   * 7) jika gagal: tampilkan alert error
   */
  const handleSave = async () => {
    if (!form.title.trim()) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Title is required",
        desc: "Please enter a task title before saving.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      return;
    }
    if (!task?.id_task) {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Cannot create here",
        desc: "Use the Add Task panel to create a new task.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      return;
    }

    const combinedDeadline =
      form.deadline &&
      new Date(`${form.deadline}T${form.time || "00:00"}`);

    const payload = {
      id_task: task.id_task,
      title: form.title,
      description: form.description || null,
      deadline: combinedDeadline ? combinedDeadline.toISOString() : null,
      priority: form.priority || null,
      status: normalizeStatus(form.status) || null,
      score: form.score === "" ? null : Number(form.score),
      link: form.link || null,
      id_course:
        form.id_course != null && form.id_course !== ""
          ? Number(form.id_course)
          : null,
      id_workspace: idWorkspace,
    };

    if (typeof onSave !== "function") {
      return;
    }

    try {
      setLoading(true);
      const savePromise = onSave(payload);
      const [saveResult] = await Promise.allSettled([
        savePromise,
        wait(1000),
      ]);

      if (saveResult.status === "rejected") {
        throw saveResult.reason;
      }

      if (typeof onTaskUpdated === "function") {
        onTaskUpdated(payload);
      }

      showAlert({
        icon: "ri-checkbox-circle-fill",
        title: "Updated",
        desc: "Task updated successfully.",
        variant: "success",
        width: 676,
        height: 380,
      });

      setEditingKey(null);
      requestAnimationFrame(() => closeDrawer());
    } catch {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to update task. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * handleDelete
   * Fungsi untuk menghapus task.
   * Flow:
   * 1) validasi ada task.id_task dan onDelete tersedia
   * 2) optional: onTaskDeleted dipanggil dulu untuk optimistic update parent
   * 3) panggil onDelete(id) untuk request delete ke server
   * 4) jika sukses: alert success + tutup drawer
   * 5) jika gagal: alert error + refreshTasks untuk sinkron ulang list
   * 6) menjaga minimal loading 1 detik (UX)
   */
  const handleDelete = async () => {
    if (!task?.id_task) return;
    if (typeof onDelete !== "function") return;

    const t0 = Date.now();

    try {
      setLoading(true);

      if (typeof onTaskDeleted === "function") {
        onTaskDeleted(task.id_task);
      }

      await onDelete(task.id_task);

      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Deleted",
        desc: `Task "${task.title}" has been deleted successfully.`,
        variant: "success",
        width: 676,
        height: 380,
      });

      requestAnimationFrame(() => closeDrawer());
    } catch {
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to delete task. Please try again.",
        variant: "destructive",
        width: 676,
        height: 380,
      });
      refreshTasks?.();
    } finally {
      const elapsed = Date.now() - t0;
      if (elapsed < 1000) await wait(1000 - elapsed);
      setLoading(false);
    }
  };

  // nama course yang tampil di trigger
  const selectedCourseName =
    courses.find((c) => String(c.id_courses) === String(form.id_course))?.name ||
    task?.course?.name ||
    task?.course_name ||
    task?.relatedCourse ||
    "";

  const isCourseLocked = !coursesFetched;

  if (!task) return null;

  // onBlur khusus deadline
  /**
   * handleDeadlineBlur
   * Fungsi blur handler khusus untuk field deadline+time.
   * Tujuan:
   * - ketika user klik keluar dari area date/time, maka editingKey ditutup
   * - setTimeout(0) dipakai supaya pengecekan document.activeElement terjadi setelah fokus benar-benar pindah
   * - deadlineEditRef memastikan: kalau fokus masih di dalam wrapper date/time, jangan tutup edit
   */
  const handleDeadlineBlur = () => {
    setTimeout(() => {
      if (!deadlineEditRef.current) return;
      if (!deadlineEditRef.current.contains(document.activeElement)) {
        setEditingKey(null);
      }
    }, 0);
  };

  return (
    <div
      ref={drawerRef}
      className="drawer-panel w-[628px] bg-[#111] h-full shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator{display:none;}
        input[type="time"]{-moz-appearance:textfield;appearance:textfield;}
        [data-slot="select-trigger"],[role="combobox"][data-slot="select-trigger"]{
          height:30px!important;min-height:30px!important;max-height:30px!important;
          line-height:30px!important;padding-top:0!important;padding-bottom:0!important;margin:0!important;width:auto!important}
        [data-slot="select-value"]{display:inline-flex!important;align-items:center!important;margin:0!important}

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .course-select [data-slot="select-content"]{
          max-width: calc(100vw - 24px);
          transform: translateX(8px);
        }
        .course-select [data-slot="select-trigger"]{ padding-right: 0 !important; }
        .course-select [data-slot="select-value"]{ padding-right: 0 !important; }
      `}</style>

      <div className="h-full overflow-y-auto pt-[112px] pr-6 pb-6 pl-[31px] text-foreground relative border border-[#464646]/50 rounded-2xl">
        <button
          onClick={closeDrawer}
          className="absolute left-3 top-4 text-gray-400 hover:text-white cursor-pointer"
          disabled={loading}
        >
          <i className="ri-arrow-right-double-line text-2xl" />
        </button>

        <div className="ml-12 mr-12" onClick={() => setEditingKey("title")}>
          <Title
            value={form.title}
            onChange={(v) => setVal("title", v)}
            onFocusOut={() => setEditingKey(null)}
            editable={editingKey === "title"}
            className="max-w-[473px] mb-12"
          />
        </div>

        <div className="ml-12 mr-12 max-w-[473px] flex flex-col">
          <div className="font-inter text-[16px] space-y-6">
            <Row
              icon="ri-sticky-note-line"
              label="Description"
              onClick={() => setEditingKey("description")}
            >
              {editingKey === "description" ? (
                <InputBase
                  value={form.description}
                  onChange={(e) => setVal("description", e.target.value)}
                  onBlur={() => setEditingKey(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                  placeholder="Add a short description"
                  autoFocus
                />
              ) : (
                <div className="w-full text-gray-200 truncate">
                  {form.description || (
                    <span className="text-gray-500">
                      Add a short description
                    </span>
                  )}
                </div>
              )}
            </Row>

            <Row
              icon="ri-calendar-2-line"
              label="Deadline"
              onClick={() => setEditingKey("deadline_time")}
            >
              {editingKey === "deadline_time" ? (
                <div
                  ref={deadlineEditRef}
                  className="flex items-center gap-2 w-full h-[30px]"
                >
                  <div className="w-[65%]">
                    <InputBase
                      as="input"
                      type="date"
                      value={form.deadline}
                      onChange={(e) => setVal("deadline", e.target.value)}
                      onBlur={handleDeadlineBlur}
                      placeholder="dd/mm/yyyy"
                      autoFocus
                    />
                  </div>
                  <div className="w-[35%]">
                    <InputBase
                      as="input"
                      type="time"
                      value={form.time}
                      onChange={(e) => setVal("time", e.target.value)}
                      onBlur={handleDeadlineBlur}
                      placeholder="--:--"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center gap-2 h-[30px]">
                  <div className="w-[65%] truncate">
                    {form.deadline ? (
                      <span className="text-gray-200">
                        {formatDateDDMMYYYY(form.deadline)}
                      </span>
                    ) : (
                      <span className="text-gray-500">dd/mm/yyyy</span>
                    )}
                  </div>
                  <div className="w-[35%] truncate">
                    {form.time ? (
                      <span className="text-gray-200">{form.time}</span>
                    ) : (
                      <span className="text-gray-500">--:--</span>
                    )}
                  </div>
                </div>
              )}
            </Row>

            <Row icon="ri-links-line" label="Related Course">
              <div
                className={`flex items-center h-[30px] w-full ${
                  isCourseLocked ? "pointer-events-none opacity-70" : ""
                }`}
              >
                <SelectUi
                  value={
                    form.id_course != null ? String(form.id_course) : undefined
                  }
                  onValueChange={(val) =>
                    setVal("id_course", val ? String(val) : null)
                  }
                  placeholder={selectedCourseName || "select course"}
                  className="course-select !w-fit !min-w-[100px] !inline-flex !items-center !justify-start !gap-0"
                  valueClassFn={() => ""}
                  align="start"
                  strategy="fixed"
                  sideOffset={6}
                  alignOffset={8}
                  open={isCourseOpen && !isCourseLocked}
                  onOpenChange={(o) => {
                    if (isCourseLocked) return;
                    setIsCourseOpen(o);
                    if (o) fetchCoursesOnce();
                  }}
                >
                  <SelectLabel className="text-[14px] font-inter text-gray-400 px-2 py-1">
                    Related Course
                    {!coursesFetched && coursesFetching && (
                      <i className="ri-loader-4-line animate-spin ml-2 text-gray-500" />
                    )}
                  </SelectLabel>

                  {coursesFetching && !coursesFetched ? (
                    <>
                      {form.id_course &&
                        (() => {
                          const cur = courses.find(
                            (c) =>
                              String(c.id_courses) === String(form.id_course)
                          );
                          if (!cur) return null;
                          return (
                            <SelectItem
                              key={`__current_${cur.id_courses}`}
                              value={String(cur.id_courses)}
                              className="text-[16px] font-inter"
                            >
                              {cur.name}
                            </SelectItem>
                          );
                        })()}
                      <SelectItem
                        value="__loading__"
                        disabled
                        className="text-[16px] font-inter"
                      >
                        Loading...
                      </SelectItem>
                    </>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto no-scrollbar cursor-pointer">
                      {courses.map((c) => (
                        <SelectItem
                          key={String(c.id_courses)}
                          value={String(c.id_courses)}
                          className="text-[16px] font-inter"
                        >
                          {c.name}
                        </SelectItem>
                      ))}
                    </div>
                  )}
                </SelectUi>
              </div>
            </Row>

            <Row icon="ri-fire-line" label="Priority">
              <BadgeSelect
                value={form.priority}
                onChange={(val) => setVal("priority", val)}
                options={["High", "Medium", "Low"]}
                valueClassFn={priorityValueClass}
                label="Priority"
              />
            </Row>

            <Row icon="ri-loader-line" label="Status">
              <BadgeSelect
                value={form.status}
                onChange={(val) => setVal("status", normalizeStatus(val))}
                options={["Not started", "In progress", "Completed", "Overdue"]}
                valueClassFn={statusValueClass}
                label="Status"
              />
            </Row>

            <Row
              icon="ri-trophy-line"
              label="Score"
              onClick={() => setEditingKey("score")}
            >
              {editingKey === "score" ? (
                <InputBase
                  as="input"
                  type="number"
                  value={form.score}
                  onChange={(e) => setVal("score", e.target.value)}
                  onBlur={() => setEditingKey(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                  placeholder="e.g. 95"
                  autoFocus
                />
              ) : (
                <div className="w-full truncate">
                  {form.score !== "" && form.score !== null ? (
                    <span className="text-gray-200">{form.score}</span>
                  ) : (
                    <span className="text-gray-500">e.g. 95</span>
                  )}
                </div>
              )}
            </Row>

            <Row
              icon="ri-share-box-line"
              label="Link"
              onClick={() => setEditingKey("link")}
            >
              {editingKey === "link" ? (
                <InputBase
                  value={form.link}
                  onChange={(e) => setVal("link", e.target.value)}
                  onBlur={() => setEditingKey(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingKey(null)}
                  placeholder="https://..."
                  autoFocus
                />
              ) : form.link ? (
                <a
                  href={form.link}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-[#60A5FA] underline decoration-[#60A5FA] underline-offset-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {form.link}
                </a>
              ) : (
                <span className="text-gray-500">https://...</span>
              )}
            </Row>
          </div>

          <div className="mt-12 flex justify-end items-center gap-[15px] font-inter">
            <button
              onClick={() => setShowConfirm(true)}
              aria-label="Delete Task"
              title="Delete Task"
              className="w-[44px] h-[36px] rounded-md bg-[#830404] flex items-center justify-center hover:brightness-110 active:scale-95 transition disabled:opacity-60 cursor-pointer"
              disabled={loading || !task?.id_task}
            >
              <i className="ri-delete-bin-2-line text-white text-[16px]" />
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 h-[36px] rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] transition-all disabled:opacity-60 cursor-pointer"
              disabled={loading || !task?.id_task}
            >
              <i className="ri-save-3-line text-foreground text-[16px]" />
              <span className="text-[15px] font-medium">
                {loading ? "Saving..." : "Save Changes"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <DeletePopup
          title="Delete Task"
          warning={`Are you sure you want to delete "${task.title}"?`}
          onCancel={() => setShowConfirm(false)}
          onDelete={() => {
            setShowConfirm(false);
            handleDelete();
          }}
        />
      )}
    </div>
  );
};

TaskDetail.propTypes = {
  task: PropTypes.shape({
    id_task: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    title: PropTypes.string,
    description: PropTypes.string,
    deadline: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    time: PropTypes.string,
    id_course: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    relatedCourse: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    priority: PropTypes.string,
    status: PropTypes.string,
    score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    link: PropTypes.string,
    course: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
    }),
    course_name: PropTypes.string,
  }),
  setDrawer: PropTypes.func,
  refreshTasks: PropTypes.func,
  courses: PropTypes.arrayOf(
    PropTypes.shape({
      id_courses: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      id_course: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      course_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      courseId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      title: PropTypes.string,
      course_name: PropTypes.string,
      label: PropTypes.string,
      course: PropTypes.shape({
        name: PropTypes.string,
      }),
    })
  ),
  onTaskUpdated: PropTypes.func,
  onTaskDeleted: PropTypes.func,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
};

TaskDetail.defaultProps = {
  task: null,
  setDrawer: undefined,
  refreshTasks: undefined,
  courses: [],
  onTaskUpdated: undefined,
  onTaskDeleted: undefined,
  onClose: undefined,
  onSave: undefined,
  onDelete: undefined,
};

export default TaskDetail;
