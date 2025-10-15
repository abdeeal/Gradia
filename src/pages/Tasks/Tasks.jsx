import React, { useEffect, useState, useRef, useMemo } from "react";
import gsap from "gsap";
import Sidebar from "../../components/Sidebar.jsx";
import TaskCard from "./components/TaskCard.jsx";
import TaskDetail from "./components/TaskDetail.jsx";
import AddTask from "./components/AddTask.jsx";

/* ===== Helpers ===== */
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const normalizeStatus = (s = "") => {
  const x = s.toLowerCase();
  if (x.includes("progress")) return "inProgress";
  if (x.includes("complete")) return "completed";
  if (x.includes("overdue") || x.includes("late")) return "overdue";
  return "notStarted";
};

const Tasks = () => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const taskContainerRef = useRef(null);

  /* ====== Initial seed -> state by columns ====== */
  const [tasksByCol, setTasksByCol] = useState(() => ({
    notStarted: [
      {
        id: uid(),
        title: "Laporan Praktikum",
        subtitle: "Dasar Kecerdasan Artifisial",
        description:
          "Membuat laporan hasil percobaan AI menggunakan dataset MNIST.",
        deadline: "2025-01-10",
        time: "16:59",
        category: "Tugas",
        relatedCourse: "Dasar Kecerdasan Artifisial",
        priority: "Medium",
        status: "Not started",
        score: "Empty",
        link: "https://elearning.telkomuniversity.ac.id",
      },
    ],
    inProgress: [
      {
        id: uid(),
        title: "Tugas Proyek Web",
        subtitle: "Pemrograman Web",
        description: "Membangun halaman dashboard React dengan TailwindCSS.",
        deadline: "2025-01-15",
        time: "23:59",
        relatedCourse: "Pemrograman Web",
        priority: "High",
        status: "In Progress",
        score: "Empty",
        link: "https://github.com/",
      },
      {
        id: uid(),
        title: "Analisis Database",
        subtitle: "Basis Data Lanjut",
        description: "Analisis struktur tabel dengan Prisma ORM.",
        deadline: "2025-01-19",
        time: "22:00",
        relatedCourse: "Basis Data Lanjut",
        priority: "Medium",
        status: "In Progress",
        score: "Empty",
        link: "https://dbdocs.io",
      },
    ],
    completed: Array.from({ length: 8 }, (_, i) => ({
      id: uid(),
      title: `Tugas Ke-${i + 1}`,
      subtitle: "Analisis Data",
      description:
        "Analisis dataset menggunakan Python dan visualisasi dengan Pandas.",
      deadline: `2024-12-${String((i % 28) + 1).padStart(2, "0")}`,
      time: "17:00",
      relatedCourse: "Analisis Data",
      priority: i % 2 === 0 ? "Medium" : "Low",
      status: "Completed",
      score: `${80 + (i % 15)}`,
      link: "https://colab.research.google.com",
    })),
    overdue: [
      {
        id: uid(),
        title: "Ujian Tengah Semester",
        subtitle: "Jaringan Komputer",
        description: "Ujian teori jaringan dan subnet mask.",
        deadline: "2024-12-20",
        time: "09:00",
        relatedCourse: "Jaringan Komputer",
        priority: "High",
        status: "Overdue",
        score: "Empty",
        link: "https://ujian.telkomuniversity.ac.id",
      },
      {
        id: uid(),
        title: "Ujian Akhir Semester",
        subtitle: "Manajemen Proyek TIK",
        description: "Ujian studi kasus proyek sistem informasi.",
        deadline: "2024-12-28",
        time: "13:00",
        relatedCourse: "Manajemen Proyek TIK",
        priority: "High",
        status: "Overdue",
        score: "Empty",
        link: "https://elearning.telkomuniversity.ac.id",
      },
    ],
  }));

  /* ===== Drawer handlers ===== */
  const handleCardClick = (task) => setSelectedTask(task);
  const handleAddClick = () => setShowAddPanel(true);
  const closeAllDrawer = () => {
    setSelectedTask(null);
    setShowAddPanel(false);
  };

  // 🔒 Kunci scroll body saat drawer aktif
  useEffect(() => {
    document.body.style.overflow =
      selectedTask || showAddPanel ? "hidden" : "auto";
  }, [selectedTask, showAddPanel]);

  // Animasi halaman utama
  useEffect(() => {
    if (taskContainerRef.current) {
      gsap.fromTo(
        taskContainerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  // Animasi drawer slide in/out
  useEffect(() => {
    if (selectedTask || showAddPanel) {
      gsap.fromTo(
        ".drawer-panel",
        { x: "100%" },
        { x: "0%", duration: 0.5, ease: "power3.out" }
      );
    } else {
      gsap.to(".drawer-panel", { x: "100%", duration: 0.4, ease: "power3.in" });
    }
  }, [selectedTask, showAddPanel]);

  /* ===== CRUD: add / update / delete ===== */
  const addTask = (payload) => {
    const col = normalizeStatus(payload.status);
    const task = { ...payload, id: uid() };
    setTasksByCol((prev) => ({
      ...prev,
      [col]: [task, ...prev[col]],
    }));
  };

  const updateTask = (updated) => {
    const newCol = normalizeStatus(updated.status);
    setTasksByCol((prev) => {
      const next = {
        notStarted: prev.notStarted.filter((t) => t.id !== updated.id),
        inProgress: prev.inProgress.filter((t) => t.id !== updated.id),
        completed: prev.completed.filter((t) => t.id !== updated.id),
        overdue: prev.overdue.filter((t) => t.id !== updated.id),
      };
      next[newCol] = [updated, ...next[newCol]];
      return next;
    });
  };

  const deleteTask = (taskId) => {
    setTasksByCol((prev) => ({
      notStarted: prev.notStarted.filter((t) => t.id !== taskId),
      inProgress: prev.inProgress.filter((t) => t.id !== taskId),
      completed: prev.completed.filter((t) => t.id !== taskId),
      overdue: prev.overdue.filter((t) => t.id !== taskId),
    }));
  };

  // Stats dari state
  const stats = useMemo(() => {
    const total =
      tasksByCol.notStarted.length +
      tasksByCol.inProgress.length +
      tasksByCol.completed.length +
      tasksByCol.overdue.length;

    return [
      { label: "Total tasks", value: total },
      { label: "Not started", value: tasksByCol.notStarted.length },
      { label: "In progress", value: tasksByCol.inProgress.length },
      { label: "Completed", value: tasksByCol.completed.length },
      { label: "Overdue", value: tasksByCol.overdue.length },
    ];
  }, [tasksByCol]);

  return (
    <div className="flex bg-background min-h-screen text-foreground font-[Montserrat] relative">
      <Sidebar />

      {/* Konten Utama (no left spacing next to sidebar) */}
      <div
        ref={taskContainerRef}
        className="flex-1 pt-[20px] pb-6 overflow-y-auto bg-background"
      >
        {/* Header (hapus padding kiri = 0) */}
        <div className="mb-[24px] px-0 pr-6">
          <h1 className="text-[20px] font-Monsterrat font-semibold">Tasks</h1>
          <p className="text-gray-400 text-[16px] font-Monsterrat">
            Keep track of your tasks all in one place.
          </p>
        </div>

        {/* Statistik (tanpa margin kiri) */}
        <div className="bg-black rounded-lg mb-[24px] border border-[#656565]/80 mr-6">
          <div className="grid grid-cols-5">
            {stats.map((stat, i, arr) => (
              <div
                key={stat.label}
                className="relative p-3 flex flex-col justify-center text-left"
              >
                <p className="text-[16px] text-gray-400 font-medium">
                  {stat.label}
                </p>
                <p className="font-extrabold mt-1 text-[26px] text-[#FFEB3B]">
                  {stat.value}
                </p>
                {i < arr.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 h-[60%] border-r border-dashed border-[#656565]/80"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bar: Overview + Filter + Sort + Add */}
        <div className="flex justify-between items-center font-[Inter] mb-2 px-0 pr-6">
          <h2 className="text-[20px] font-semibold">Overview</h2>

          <div className="flex items-center gap-2.5">
            <button className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-md text-[16px] border border-zinc-700 hover:border-zinc-500 transition-all">
              <i className="ri-filter-3-line text-[15px]"></i> Filter
            </button>

            <button className="flex items-center gap-1.5 px-[10px] py-[6px] rounded-md text-[16px] border border-zinc-700 hover:border-zinc-500 transition-all">
              <i className="ri-sort-desc text-[15px]"></i> Sort
            </button>

            <button
              onClick={handleAddClick}
              className="flex items-center gap-1.5 px-[12px] py-[6px] rounded-md text-[16px] text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #34146C 0%, #28073B 100%)",
              }}
            >
              <i className="ri-add-line text-[16px]"></i> Add Task
            </button>
          </div>
        </div>

        <div className="border-t border-[#464646] mb-[14px] mr-6"></div>

        {/* FRAME BESAR (tanpa margin kiri) */}
        <div className="bg-background-secondary p-5 rounded-2xl mr-6 border border-[#2c2c2c]">
          {/* gap antar kolom = 8px */}
          <div className="grid grid-cols-4 gap-2">
            {/* ------------------ NOT STARTED ------------------ */}
            <TaskCategory
              title="Not Started"
              icon="ri-file-edit-line"
              iconBg="bg-[#6B7280]/20"
              iconColor="#D4D4D8"
              tasks={tasksByCol.notStarted}
              onCardClick={handleCardClick}
            />

            {/* ------------------ IN PROGRESS ------------------ */}
            <TaskCategory
              title="In Progress"
              icon="ri-progress-2-line"
              iconBg="bg-[#06B6D4]/20"
              iconColor="#22D3EE"
              tasks={tasksByCol.inProgress}
              onCardClick={handleCardClick}
            />

            {/* ------------------ COMPLETED ------------------ */}
            <TaskCategory
              title="Completed"
              icon="ri-checkbox-circle-line"
              iconBg="bg-[#22C55E]/20"
              iconColor="#4ADE80"
              tasks={tasksByCol.completed}
              onCardClick={handleCardClick}
            />

            {/* ------------------ OVERDUE ------------------ */}
            <TaskCategory
              title="Overdue"
              icon="ri-alarm-warning-line"
              iconBg="bg-[#EF4444]/20"
              iconColor="#F87171"
              tasks={tasksByCol.overdue}
              onCardClick={handleCardClick}
            />
          </div>
        </div>
      </div>

      {/* Overlay Hitam */}
      {(selectedTask || showAddPanel) && (
        <div
          onClick={closeAllDrawer}
          className="fixed inset-0 bg-black/50 z-40 cursor-pointer"
        ></div>
      )}

      {/* Drawer Detail */}
      {selectedTask && (
        <div className="drawer-panel fixed top-0 right-0 h-full z-50">
          <TaskDetail
            task={selectedTask}
            onClose={closeAllDrawer}
            onUpdate={(updatedTask) => {
              updateTask(updatedTask);
              setSelectedTask(updatedTask); // keep viewing latest data
            }}
            onDelete={(taskId) => {
              deleteTask(taskId);
              closeAllDrawer();
            }}
          />
        </div>
      )}

      {/* Drawer Add */}
      {showAddPanel && (
        <div className="drawer-panel fixed top-0 right-0 h-full z-50">
          <AddTask
            onClose={closeAllDrawer}
            onSubmit={(payload) => {
              addTask(payload);
            }}
          />
        </div>
      )}
    </div>
  );
};

/* -------------------------- Task Category -------------------------- */
const TaskCategory = ({ title, icon, iconBg, iconColor, tasks, onCardClick }) => {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (sectionRef.current) {
      gsap.fromTo(
        sectionRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  return (
    // gap antar elemen di kolom = 8px
    <div ref={sectionRef} className="flex flex-col w-full gap-2">
      {/* Header kategori */}
      <div className="flex justify-between items-center bg-[#0a0a0a] px-3 py-2 rounded-lg min-h-[42px] w-full">
        <span className="font-semibold text-[16px] text-white capitalize">
          {title}
        </span>
        <div className={`${iconBg} w-8 h-8 rounded-md flex items-center justify-center`}>
          <i className={`${icon} text-[20px]`} style={{ color: iconColor }} />
        </div>
      </div>

      {/* List task (gap 8px) */}
      <div className="flex flex-col gap-2 w-full">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onCardClick(task)}
            className="w-full cursor-pointer"
          >
            <TaskCard {...task} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
