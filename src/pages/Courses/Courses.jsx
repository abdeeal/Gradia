import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
} from "react";
import gsap from "gsap";
import { useMediaQuery } from "react-responsive";
import Sidebar from "../../components/Sidebar.jsx";
import CourseCard from "./components/CourseCard.jsx";
import CourseDetail from "./components/CourseDetail.jsx";
import AddCourse from "./components/AddCourse.jsx";
import { Tab } from "./layouts/Tab.jsx";

/* ===== Shimmer CSS (copy style dari PresenceCard) ===== */
const ShimmerStyles = () => (
  <style>{`
    .gradia-shimmer {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(
        90deg,
        rgba(15, 15, 15, 0) 0%,
        rgba(63, 63, 70, 0.9) 50%,
        rgba(15, 15, 15, 0) 100%
      );
      transform: translateX(-100%);
      animation: gradia-shimmer-move 1.2s infinite;
      background-size: 200% 100%;
      pointer-events: none;
    }

    @keyframes gradia-shimmer-move {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `}</style>
);

/* ===== Helper: ambil id_workspace dari storage ===== */
/* 🔥 PRIORITAS LOCAL STORAGE → BARU SESSION → FALLBACK 1 */
const getWorkspaceId = () => {
  try {
    if (typeof window === "undefined") return 1;

    const fromLocal = window.localStorage?.getItem("id_workspace");
    const fromSession = window.sessionStorage?.getItem("id_workspace");

    const raw = fromLocal ?? fromSession ?? "1";
    const num = Number(raw);

    return Number.isFinite(num) && num > 0 ? num : 1;
  } catch {
    return 1;
  }
};

/* ===== Helpers: mapping API <-> UI ===== */
const toUiCourse = (api) => ({
  id: api.id_courses,
  title: api.name,
  alias: api.alias,
  lecturer: api.lecturer,
  phone: api.phone || "",
  day: api.day,
  time: `${(api.start || "").slice(0, 5)} - ${(api.end || "").slice(0, 5)}`,
  room: api.room,
  sks: Number(api.sks) || 0,
  link: api.link || "",
  id_workspace: api.id_workspace ?? null,
});

const toApiCourse = (ui) => {
  const [start = "", end = ""] = (
    ui.time || `${ui.startTime || ""} - ${ui.endTime || ""}`
  )
    .split(" - ")
    .map((s) => s.trim());

  const workspaceId = getWorkspaceId();

  return {
    id_courses: ui.id, // undefined/null untuk POST
    name: ui.title || ui.alias || "",
    alias: ui.alias || "",
    lecturer: ui.lecturer || "",
    phone: ui.phone || "",
    day: ui.day || "",
    start,
    end,
    room: ui.room || "",
    sks: Number(ui.sks) || 0,
    link: ui.link || "",
    // 🔥 selalu kirim id_workspace ke backend
    id_workspace: workspaceId,
  };
};

/* ===== Order of days (always render) ===== */
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// shimmer config
const SKELETON_PER_DAY = 1;

export const Courses = () => {
  const [courses, setCourses] = useState([]); // flat array (UI shape)
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null); // UI course
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const drawerRef = useRef(null);
  const headerRef = useRef(null);

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  // 🔥 workspaceId diambil sekali dari helper
  const workspace = useMemo(() => getWorkspaceId(), []);

  /* ===== Fetch from API ===== */
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // 🔥 kirim idWorkspace ke API supaya filter di backend
    fetch(`/api/courses?idWorkspace=${workspace}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch courses");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const uiAll = Array.isArray(data) ? data.map(toUiCourse) : [];

        // 🔥 tambahan filter di frontend jaga-jaga
        const ui = uiAll.filter(
          (c) => Number(c.id_workspace) === Number(workspace)
        );
        setCourses(ui);
      })
      .catch((err) => console.error("Error fetching courses:", err))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [workspace]);

  /* ===== Kunci scroll body saat drawer aktif ===== */
  useEffect(() => {
    const lock = selectedCourse || showAdd;
    const prev = document.body.style.overflow;
    document.body.style.overflow = lock ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, [selectedCourse, showAdd]);

  useLayoutEffect(() => {
    const el = drawerRef.current;
    if (!el) return;

    if (selectedCourse || showAdd) {
      gsap.fromTo(
        el,
        { x: "100%" },
        { x: "0%", duration: 0.5, ease: "power3.out" }
      );
    } else {
      gsap.to(el, { x: "100%", duration: 0.4, ease: "power3.in" });
    }
  }, [selectedCourse, showAdd]);

  /* ===== Search & Grouping ===== */
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) return courses;
    const term = searchTerm.toLowerCase();
    return courses.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(term) ||
        (c.alias || "").toLowerCase().includes(term) ||
        (c.lecturer || "").toLowerCase().includes(term)
    );
  }, [courses, searchTerm]);

  const groupedCourses = useMemo(() => {
    const grouped = {};
    filteredCourses.forEach((c) => {
      const day = (c.day || "").trim();
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(c);
    });
    return grouped;
  }, [filteredCourses]);

  // Pastikan semua hari ada (meski kosong) agar count selalu tampil
  const groupedWithAllDays = useMemo(() => {
    const base = dayOrder.reduce((acc, d) => ({ ...acc, [d]: [] }), {});
    return { ...base, ...groupedCourses };
  }, [groupedCourses]);

  /* ===== ADD: AddCourse -> POST -> update state ===== */
  const handleAddCourse = async (newCourseUi) => {
    try {
      const payload = toApiCourse(newCourseUi);
      const res = await fetch(`/api/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create course");
      const json = await res.json(); // { message, data: [...] }
      const created = Array.isArray(json?.data) ? json.data[0] : json;
      const createdUi = toUiCourse(created);

      // 🔥 hanya masukkan course yg workspace-nya sama
      if (Number(createdUi.id_workspace) !== Number(workspace)) return;

      setCourses((prev) => [createdUi, ...prev]);
      setShowAdd(false);
    } catch (e) {
      console.error(e);
    }
  };

  /* ===== UPDATE: CourseDetail -> PUT -> sync UI ===== */
  const handleUpdateCourse = async (partialUi) => {
    // Gabung dengan selectedCourse supaya id & field lain terjaga
    const merged = { ...selectedCourse, ...partialUi };

    // Normalisasi id (jaga-jaga kalau bentuk id beda)
    const id =
      merged.id ??
      merged.id_courses ??
      merged.id_course ??
      merged.course_id;

    if (!id) {
      console.error("Missing course id for update", merged);
      throw new Error("Missing course id");
    }

    merged.id = id;

    // Optimistic update di UI
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...merged } : c))
    );

    // 🔥 pastikan body ke backend SELALU punya id_courses
    const basePayload = toApiCourse(merged);
    const payload = {
      ...basePayload,
      id_courses: id, // override supaya tidak pernah undefined
    };

    try {
      const res = await fetch(`/api/courses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to update course");
      }

      setSelectedCourse(merged);
    } catch (e) {
      console.error(e);
      // lempar lagi supaya CourseDetail bisa nangkep dan show alert error
      throw e;
    }
  };

  /* ===== DELETE: sinkron UI setelah API delete ===== */
  const handleDeleteCourse = async (id) => {
    try {
      const res = await fetch(`/api/courses?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete course");
      setCourses((prev) => prev.filter((c) => c.id !== id));
      setSelectedCourse(null);
    } catch (e) {
      console.error(e);
    }
  };

  /* ===== Close dengan animasi keluar lalu unmount ===== */
  const handleCloseDrawer = () => {
    if (drawerRef.current) {
      gsap.to(drawerRef.current, {
        x: "100%",
        duration: 0.35,
        ease: "power3.in",
        onComplete: () => {
          setSelectedCourse(null);
          setShowAdd(false);
        },
      });
    } else {
      setSelectedCourse(null);
      setShowAdd(false);
    }
  };

  if (isMobile || isTablet) return <Tab />;

  return (
    // gap-6 = 24px antara Sidebar dan konten (sesuai revisi)
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background font-inter text-foreground gap-[0px]">
      <ShimmerStyles />
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex-1 bg-background px-0 py-6 pr-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="font-inter text-[20px] font-semibold leading-6">
              Courses
            </h1>
            <p className="mt-2 font-inter text-[16px] text-gray-400">
              Keep track of your courses all in one place.
            </p>
          </div>

          <div className="flex w-64 items-center rounded-lg border border-[#464646] bg-[#000000] px-3 py-2">
            <i className="ri-search-line mr-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-transparent text-sm text-gray-200 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Overview */}
        <div className="relative z-30 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Overview</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] px-4 py-2 text-sm shadow-[0_0_10px_rgba(147,51,234,0.3)] transition hover:shadow-[0_0_18px_rgba(147,51,234,0.5)]"
          >
            <i className="ri-add-line text-purple-200" /> Add Course
          </button>
        </div>

        <div className="mb-6 border-t border-[#464646]/80" />

        {/* GRID */}
        <div
          className={`relative overflow-x-auto rounded-2xl bg-[#141414] p-4 transition-all duration-300 ${
            selectedCourse || showAdd ? "opacity-60" : "opacity-100"
          }`}
        >
          <div className="grid grid-cols-5 items-start gap-4">
            {dayOrder.map((day) => {
              const list = groupedWithAllDays[day] || [];
              return (
                <div key={day} className="flex w-full flex-col">
                  {/* header hari */}
                  <div className="mb-3 w-full rounded-[8px] bg-[#000000] px-3 py-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-medium text-white">
                        {day}
                      </h3>
                      <span className="rounded-full bg-drop-yellow px-2 py-[2px] text-yellow">
                        {list.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-2 font-[Montserrat]">
                    {loading ? (
                      // ===== SHIMMER SKELETON (width ikut kolom, height 160) =====
                      Array.from({ length: SKELETON_PER_DAY }).map((_, idx) => (
                        <div
                          key={idx}
                          className="relative flex h-[140px] w-full shrink-0 flex-col overflow-hidden rounded-xl bg-[#242424] px-3.5 py-3 shadow"
                        >
                          <div className="gradia-shimmer" />
                          {/* konten dummy disembunyikan, hanya buat bentuk layout */}
                          <div className="opacity-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-gray-500" />
                                <p className="text-[16px]">00:00 - 00:00</p>
                              </div>
                              <span className="rounded-md px-1.5 py-[2px] text-[16px]">
                                STATUS
                              </span>
                            </div>

                            <div className="flex flex-1 flex-col justify-center">
                              <h3 className="line-clamp-2 break-words text-[16px] font-semibold leading-snug">
                                Dummy Course Title
                              </h3>
                              <p className="mt-1 text-[16px]">ROOM</p>
                            </div>

                            <button className="mt-2 flex items-center self-start gap-1 rounded-md bg-gradient-to-l from-[#28073B] to-[#34146C] px-3 py-1.5 text-[16px] cursor-pointer">
                              Button{" "}
                              <i className="ri-logout-circle-r-line ml-1" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : list.length > 0 ? (
                      list.map((course) => (
                        <div
                          key={course.id}
                          className="course-card"
                          onClick={() => setSelectedCourse(course)}
                        >
                          <CourseCard course={course} />
                        </div>
                      ))
                    ) : (
                      // ======= NO COURSES STATE (TINGGI 160PX) =======
                      <div className="flex h-[140px] w-full items-center justify-center rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-5 text-center text-neutral-600">
                        No courses
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* OVERLAY & DRAWER */}
      {(selectedCourse || showAdd) && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-end bg-black/50"
          onClick={handleCloseDrawer}
        >
          <div
            ref={drawerRef}
            className="drawer-panel relative h-full w-[628px] bg-[#111] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedCourse && (
              <CourseDetail
                course={selectedCourse}
                onClose={handleCloseDrawer}
                onSave={handleUpdateCourse}
                onDelete={handleDeleteCourse}
              />
            )}

            {showAdd && (
              <AddCourse onClose={handleCloseDrawer} onAdd={handleAddCourse} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
