import React, { useEffect, useRef, useState, useMemo, useLayoutEffect } from "react";
import gsap from "gsap";
import { useMediaQuery } from "react-responsive";
import Sidebar from "../../components/Sidebar.jsx";
import CourseCard from "./components/CourseCard.jsx";
import CourseDetail from "./components/CourseDetail.jsx";
import AddCourse from "./components/AddCourse.jsx";
import { Tab } from "./layouts/Tab.jsx";

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
  link: api.link || "#",
  color: api.color || "red",
});

const toApiCourse = (ui) => {
  const [start = "", end = ""] = (
    ui.time || `${ui.startTime || ""} - ${ui.endTime || ""}`
  )
    .split(" - ")
    .map((s) => s.trim());

  return {
    id_courses: ui.id, // undefined/null for POST
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
    color: ui.color || "red",
  };
};

/* ===== Order of days (always render) ===== */
const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const Courses = () => {
  const [courses, setCourses] = useState([]); // flat array (UI shape)
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null); // UI course
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const drawerRef = useRef(null);
  const headerRef = useRef(null);
  const gridRef = useRef(null);

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  /* ===== Fetch from API ===== */
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch courses");
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        const ui = Array.isArray(data) ? data.map(toUiCourse) : [];
        setCourses(ui);
      })
      .catch((err) => console.error("Error fetching courses:", err))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

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
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create course");
      const created = await res.json(); // expect full record with id_courses
      const createdUi = toUiCourse(created);
      setCourses((prev) => [createdUi, ...prev]);
      setShowAdd(false);
    } catch (e) {
      console.error(e);
    }
  };

  /* ===== UPDATE: CourseDetail -> PUT -> sync UI ===== */
  const handleUpdateCourse = async (updatedUi) => {
    // Optimistic update
    setCourses((prev) =>
      prev.map((c) => (c.id === updatedUi.id ? { ...c, ...updatedUi } : c))
    );

    try {
      const payload = toApiCourse(updatedUi);
      await fetch(`/api/courses/${updatedUi.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSelectedCourse(updatedUi);
    } catch (e) {
      console.error(e);
      // TODO: rollback or toast error if needed
    }
  };

  /* ===== Close dengan animasi keluar lalu unmount ===== */
  const handleCloseDrawer = () => {
    if (drawerRef.current) {
      // Animasi keluar, lalu baru reset state agar panel tidak hilang duluan
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
    <div className="flex min-h-screen w-full bg-background text-foreground font-inter relative overflow-hidden gap-[0px]">
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-background px-0 pr-6 py-6 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-inter text-[20px] font-semibold leading-6">
              Courses
            </h1>
            <p className="font-inter text-[16px] mt-2 text-gray-400">
              Keep track of your courses all in one place.
            </p>
          </div>

          <div className="flex items-center bg-[#000000] border border-[#464646] rounded-lg px-3 py-2 w-64">
            <i className="ri-search-line text-gray-400 mr-2"></i>
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent outline-none w-full text-sm text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Overview */}
        <div className="flex items-center justify-between mb-4 relative z-30">
          <h2 className="text-lg font-semibold">Overview</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gradient-to-br from-[#34146C] to-[#28073B] shadow-[0_0_10px_rgba(147,51,234,0.3)] hover:shadow-[0_0_18px_rgba(147,51,234,0.5)] transition"
          >
            <i className="ri-add-line text-purple-200"></i> Add Course
          </button>
        </div>

        <div className="border-t border-[#464646]/80 mb-6"></div>

        {/* GRID */}
        <div
          className={`bg-[#141414] rounded-2xl p-4 overflow-x-auto relative transition-all duration-300 ${
            selectedCourse || showAdd ? "opacity-60" : "opacity-100"
          }`}
        >
          {loading ? (
            <div className="text-gray-400 text-sm">Loading courses…</div>
          ) : (
            <div className="grid grid-cols-5 gap-4 items-start">
              {dayOrder.map((day) => {
                const list = groupedWithAllDays[day] || [];
                return (
                  <div key={day} className="flex flex-col w-full">
                    {/* header hari */}
                    <div className="bg-[#000000] rounded-[8px] px-3 py-5 mb-3 w-full">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-white text-[15px]">
                          {day}
                        </h3>
                        <span className="bg-drop-yellow px-2 py-[2px] rounded-full text-yellow">
                          {list.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 font-[Montserrat] w-full">
                      {list.length > 0 ? (
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
                        <div className="text-neutral-600 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-5 text-center">
                          No courses
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY & DRAWER */}
      {(selectedCourse || showAdd) && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex justify-end items-start"
          onClick={handleCloseDrawer}
        >
          <div
            ref={drawerRef}
            // tambahkan class "drawer-panel" agar animasi useEffect bekerja
            className="drawer-panel w-[628px] bg-[#111] h-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedCourse && (
              <CourseDetail
                course={selectedCourse}
                onClose={handleCloseDrawer}
                onSave={handleUpdateCourse}
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
