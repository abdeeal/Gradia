import React from "react";
import PropTypes from "prop-types";
import { getWorkspaceId } from "../../../components/GetWorkspace";

const MIN_SKELETON_MS = 200;

// ==== LAYOUT CONST ====
const FRAME_W = "100%";
const FRAME_H = 246;
const PAD_X = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;
const HEADER_GAP = 18;
const HEADER_HEIGHT = 32;
const LIST_MAX_H =
  FRAME_H - PAD_TOP - PAD_BOTTOM - HEADER_GAP - HEADER_HEIGHT;
const SKELETON_COUNT = 3;

// ==== DATE HELPERS ====
const jakartaFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const toYmdJakarta = (d) => {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return jakartaFormatter.format(date);
};

// normalisasi courses: samakan bentuk id & name
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

export default function DueToday(props) {
  const {
    defaultOpen = true,
    taskUrl = "/tasks",
    fetchTasks, // async () => Task[]
    fetchCourses, // async () => Course[]
    tasksEndpoint, // mis. "/api/tasks"
    coursesEndpoint, // mis. "/api/courses"
  } = props;

  const [open] = React.useState(defaultOpen);
  const [todayItems, setTodayItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

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

  // warna label (day/night mode)
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

    const bg = (isNight ? bgMapNight : bgMapDay)[p];
    const text = isNight ? textNight : textDayMap[p];

    return `${bg} ${text} font-semibold`;
  };

  const workspace = React.useMemo(() => getWorkspaceId(), []);

  const todayJakarta = React.useMemo(
    () => toYmdJakarta(new Date()),
    []
  );

  const withWorkspace = React.useCallback(
    (baseUrl) => {
      if (!baseUrl) return undefined;

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost";

      const url = new URL(baseUrl, origin);
      const sp = new URLSearchParams(url.search);

      if (!sp.get("idWorkspace")) {
        sp.set("idWorkspace", String(workspace));
      }

      url.search = sp.toString();

      return typeof window !== "undefined"
        ? url.toString()
        : `${url.pathname}${url.search}`;
    },
    [workspace]
  );

  const tasksUrl = React.useMemo(
    () => withWorkspace(tasksEndpoint || "/api/tasks"),
    [tasksEndpoint, withWorkspace]
  );

  const coursesUrl = React.useMemo(
    () => withWorkspace(coursesEndpoint || "/api/courses"),
    [coursesEndpoint, withWorkspace]
  );

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");
      const startTime = Date.now();

      try {
        let tasks;
        let courses;

        if (typeof fetchTasks === "function") {
          tasks = await fetchTasks();
        } else if (tasksUrl) {
          const r = await fetch(tasksUrl, { cache: "no-store" });
          if (!r.ok) throw new Error("Failed to fetch tasks");
          tasks = await r.json();
        }

        if (typeof fetchCourses === "function") {
          courses = await fetchCourses();
        } else if (coursesUrl) {
          const r = await fetch(coursesUrl, { cache: "no-store" });
          if (!r.ok) throw new Error("Failed to fetch courses");
          courses = await r.json();
        }

        const rawCourses = Array.isArray(courses)
          ? courses
          : courses?.data || [];

        const normalizedCourses = normalizeCourses(rawCourses);
        const courseNameById = new Map(
          normalizedCourses.map((c) => [String(c.id_courses), c.name])
        );

        const tasksArr = Array.isArray(tasks) ? tasks : tasks?.data || [];

        const normalized = tasksArr
          .filter((t) => toYmdJakarta(t.deadline) === todayJakarta)
          .map((t) => ({
            title: t.title,
            subject: courseNameById.get(String(t.id_course)) || "—",
            priority: t.priority || "Low",
          }));

        if (active) setTodayItems(normalized);
      } catch (e) {
        if (active) {
          setTodayItems([]);
          setError(e?.message || "Failed to load");
        }
      } finally {
        const elapsed = Date.now() - startTime;
        const finish = () => {
          if (active) setLoading(false);
        };

        if (elapsed < MIN_SKELETON_MS) {
          setTimeout(finish, MIN_SKELETON_MS - elapsed);
        } else {
          finish();
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [fetchTasks, fetchCourses, tasksUrl, coursesUrl, todayJakarta]);

  const noDueToday = !loading && todayItems.length === 0;

  return (
    <div
      id="id_due"
      className="rounded-2xl border border-[#464646]/50 box-border w-full h-[246px] 2xl:h-[300px]"
      style={{
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
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: HEADER_GAP }}
      >
        <h2
          className="font-semibold text-white"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: 20,
            lineHeight: "20px",
          }}
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
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 17L17 7M7 7h10v10"
            />
          </svg>
        </a>
      </div>

      {/* Body */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ maxHeight: open ? LIST_MAX_H : 0 }}
      >
        <div
          className="scrollbar-hide pr-2"
          style={{ maxHeight: LIST_MAX_H, overflowY: "auto" }}
        >
          {loading ? (
            <div className="flex flex-col" style={{ gap: 10 }}>
              {Array.from({ length: SKELETON_COUNT }).map((_, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl"
                  style={{
                    width: "100%",
                    height: 100,
                    background: "#262626",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <div className="gradia-shimmer" />

                  {/* isi dummy (disembunyikan) */}
                  <div
                    className="flex"
                    style={{ opacity: 0, width: "100%", height: "100%" }}
                  >
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
                      <i
                        className="ri-article-line"
                        style={{
                          fontSize: 28,
                          color: "#A78BFA",
                          lineHeight: "28px",
                        }}
                      />
                    </div>

                    <div
                      className="flex-1"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <h3
                        className="font-semibold text-white"
                        style={{
                          fontSize: 16,
                          lineHeight: "20px",
                          marginTop: 4,
                        }}
                      >
                        Dummy Task Title
                      </h3>

                      <p
                        className="text-gray-300"
                        style={{
                          fontSize: 16,
                          lineHeight: "18px",
                          marginTop: 4,
                        }}
                      >
                        SUBJECT
                      </p>

                      <span
                        className="inline-flex"
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
                        PRIORITY
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : noDueToday ? (
            <div
              className="rounded-xl flex items-center justify-center"
              style={{
                width: FRAME_W - PAD_X * 2,
                height: 162,
                background: "#181818",
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "26px",
                  color: "#FFFFFF",
                }}
              >
                No Tasks Due Today
              </span>
            </div>
          ) : (
            <div className="flex flex-col bg-background rounded-[12px] border border-border/50" style={{ gap: 10 }}>
              {todayItems.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-xl"
                  style={{
                    width: FRAME_W - PAD_X * 2,
                    height: 96,
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 12,
                  }}
                >
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
                    <i
                      className="ri-article-line"
                      style={{
                        fontSize: 28,
                        color: "#A78BFA",
                        lineHeight: "28px",
                      }}
                    />
                  </div>

                  <div
                    className="flex flex-col gap-0.5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <h3
                      className="font-semibold text-white line-clamp-1"
                      style={{
                        fontSize: 16,
                        lineHeight: "20px",
                        marginTop: 4,
                      }}
                    >
                      {it.title}
                    </h3>

                    <p
                      className="text-gray-300 mb-1"
                      style={{
                        fontSize: 16,
                        lineHeight: "18px",
                        marginTop: 4,
                      }}
                    >
                      {it.subject}
                    </p>

                    {it.priority && (
                      <span
                        className={`w-fit ${prColor(it.priority)}`}
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

        {error && !loading && (
          <div
            className="mt-2"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              lineHeight: "16px",
              color: "#F87171",
              opacity: 0.9,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

DueToday.propTypes = {
  defaultOpen: PropTypes.bool,
  taskUrl: PropTypes.string,
  fetchTasks: PropTypes.func,
  fetchCourses: PropTypes.func,
  tasksEndpoint: PropTypes.string,
  coursesEndpoint: PropTypes.string,
};
