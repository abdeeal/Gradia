import React from "react";

export default function DueToday(props) {
  const {
    // fallback jika tidak ada data dari API
    items = [
      { title: "Penilaian Harian 4", subject: "Jarkom", priority: "Low" },
      { title: "Penilaian Harian 4", subject: "DKA", priority: "Medium" },
    ],
    defaultOpen = true,
    taskUrl = "/tasks",

    // opsi pengambilan data
    fetchTasks,       // async () => Task[]
    fetchCourses,     // async () => Course[]
    tasksEndpoint,    // string, mis. "/api/tasks"
    coursesEndpoint,  // string, mis. "/api/courses"
  } = props;

  const [open] = React.useState(defaultOpen);

  // malam: 18:01–05:59 (auto-update tiap menit)
  const checkIsNight = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    return h > 18 || (h === 18 && m >= 1) || h < 6;
  };
  const [isNight, setIsNight] = React.useState(checkIsNight());
  React.useEffect(() => {
    const id = setInterval(() => setIsNight(checkIsNight()), 60_000);
    return () => clearInterval(id);
  }, []);

  // warna label (day/night mode) — TIDAK diubah
  const prColor = (p = "Low") => {
    const bgMapDay = {
      High: "bg-[#ef4444]/20",
      Medium: "bg-[#eab308]/20",
      Low: "bg-[#6B7280]/20",
    };
    const bgMapNight = {
      High: "bg-[#ef4444]",
      Medium: "bg-[#eab308]",
      Low: "bg-[#6B7280]",
    };
    const textDayMap = {
      High: "text-[#F87171]",
      Medium: "text-[#FDE047]",
      Low: "text-[#D4D4D8]",
    };
    const textNight = "text-black";
    const bg = isNight ? bgMapNight[p] : bgMapDay[p];
    const text = isNight ? textNight : textDayMap[p];
    return `${bg} ${text} font-semibold`;
  };

  // ====== DATA WIRING ======
  const [todayItems, setTodayItems] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);

  // helper: tanggal "hari ini" di Asia/Jakarta (YYYY-MM-DD)
  const todayJakarta = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(new Date()); // "YYYY-MM-DD"
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        let tasks;
        let courses;

        if (typeof fetchTasks === "function") tasks = await fetchTasks();
        else if (tasksEndpoint) {
          const r = await fetch(tasksEndpoint);
          if (!r.ok) throw new Error("Failed to fetch tasks");
          tasks = await r.json();
        }

        if (typeof fetchCourses === "function") courses = await fetchCourses();
        else if (coursesEndpoint) {
          const r = await fetch(coursesEndpoint);
          if (!r.ok) throw new Error("Failed to fetch courses");
          courses = await r.json();
        }

        // jika tidak ada API, jangan override items prop
        if (!tasks || !courses) {
          if (!cancelled) {
            setTodayItems([]);
            setLoaded(true);
          }
          return;
        }

        const courseNameById = new Map(
          courses.map((c) => [String(c.id), c.name])
        );

        // Normalisasi tanggal deadline ke YYYY-MM-DD (Asia/Jakarta)
        const toYmdJakarta = (d) => {
          if (!d) return null;
          const date = new Date(d);
          if (isNaN(date.getTime())) return null;
          const fmt = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          return fmt.format(date);
        };

        const filtered = tasks
          .filter((t) => toYmdJakarta(t.deadline) === todayJakarta)
          .map((t) => ({
            title: t.title,
            subject: courseNameById.get(String(t.id_course)) || "—",
            priority: t.priority || "Low",
          }));

        if (!cancelled) {
          setTodayItems(filtered);
          setLoaded(true);
        }
      } catch (e) {
        if (!cancelled) {
          setTodayItems([]);
          setLoaded(true);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchTasks, fetchCourses, tasksEndpoint, coursesEndpoint, todayJakarta]);

  // Samakan frame luar dengan CoursesToday — TIDAK diubah
  const FRAME_W = 259;
  const FRAME_H = 246;
  const PAD_X = 16;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 16;
  const HEADER_GAP = 18;
  const headerHeight = 32;
  const listMaxH = FRAME_H - PAD_TOP - PAD_BOTTOM - HEADER_GAP - headerHeight;

  // Sumber data yang dirender
  const renderFromApi = loaded;
  const displayItems = renderFromApi ? todayItems : items.map((x) => ({ ...x }));
  const noDueToday = renderFromApi && displayItems.length === 0;

  return (
    <div
      id="id_due"
      className="rounded-2xl border border-[#464646]/50"
      style={{
        width: FRAME_W,
        height: FRAME_H,
        backgroundImage: "linear-gradient(180deg, #070707 0%, #141414 100%)",
        paddingLeft: PAD_X,
        paddingRight: PAD_X,
        paddingTop: PAD_TOP,
        paddingBottom: PAD_BOTTOM,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        #id_due .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        #id_due .scrollbar-hide::-webkit-scrollbar { display:none; width:0; height:0; }
      `}</style>

      {/* Header — TIDAK diubah */}
      <div className="flex items-center justify-between" style={{ marginBottom: HEADER_GAP }}>
        <h2
          className="font-semibold text-white"
          style={{ fontFamily: "Montserrat, sans-serif", fontSize: 20, lineHeight: "20px" }}
        >
          Due Today
        </h2>

        <a
          href={taskUrl}
          aria-label="Buka halaman task"
          title="Buka halaman task"
          className="rounded-full flex items-center justify-center border border-white/80 hover:bg-white/10"
          style={{ width: 32, height: 32 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>
      </div>

      {/* Body — tetap, tambah empty state bila tidak ada data */}
      <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: open ? listMaxH : 0 }}>
        <div className="scrollbar-hide pr-2" style={{ maxHeight: listMaxH, overflowY: "auto" }}>
          {noDueToday ? (
            <div
              className="rounded-xl flex items-center justify-center"
              style={{
                width: FRAME_W - PAD_X * 2,
                height: 162,
                background: "#181818",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: "22px",
                  color: "#FFFFFF",
                }}
              >
                No Due Today
              </span>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {displayItems.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-xl"
                  style={{
                    width: FRAME_W - PAD_X * 2,
                    height: 91,
                    background: "#262626",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 12,
                  }}
                >
                  {/* Icon kiri (28x28) — TIDAK diubah */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      marginLeft: 12,
                      marginRight: 10,
                      marginTop: 26,
                      marginBottom: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="ri-article-line" style={{ fontSize: 28, color: "#A78BFA", lineHeight: "28px" }} />
                  </div>

                  {/* Texts — subject = related course */}
                  <div className="flex-1" style={{ fontFamily: "Inter, sans-serif" }}>
                    <h3 className="font-semibold text-white" style={{ fontSize: 16, lineHeight: "20px", marginTop: 4 }}>
                      {it.title}
                    </h3>

                    <p className="text-gray-300" style={{ fontSize: 16, lineHeight: "18px", marginTop: 4 }}>
                      {it.subject}
                    </p>

                    {it.priority && (
                      <span
                        className={`inline-flex ${prColor(it.priority)}`}
                        style={{
                          height: 17,
                          lineHeight: "20px",
                          fontSize: 14,
                          borderRadius: 4,
                          padding: "0 8px",
                          marginTop: 6,
                          alignItems: "center",
                        }}
                      >
                        {it.priority}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
