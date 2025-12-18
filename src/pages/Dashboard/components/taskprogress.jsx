import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { PieChart, Pie, Cell } from "recharts";
import { useMediaQuery } from "react-responsive";

const MIN_SKEL_MS = 200;

/* Helpers */
const getWsId = () => {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const v = Number(window.sessionStorage.getItem("id_workspace"));
      return Number.isFinite(v) && v > 0 ? v : 1;
    }
  } catch {
    // ignore, fallback 1
  }
  return 1;
};

const keyfy = (v) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? String(v) : String(v);
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "");
};

const getStatus = (t) => {
  if (!t) return "";
  if (t.status && typeof t.status === "object" && "name" in t.status) {
    return t.status.name;
  }
  if (t.status !== undefined) return t.status;
  if (t.statusId !== undefined) return t.statusId;
  if (t.state && typeof t.state === "object" && "name" in t.state) {
    return t.state.name;
  }
  if (t.state !== undefined) return t.state;
  if (t.status_name !== undefined) return t.status_name;
  return "";
};

const getId = (t) => t?.id?.task ?? t?.id_task ?? t?.task_id ?? t?.id ?? null;

const NOT_KEYS = new Set(
  [
    "not started",
    "not_started",
    "not-started",
    "todo",
    "to do",
    "pending",
    "backlog",
    "new",
    "open",
    "ready",
    "queued",
    "created",
    "belummulai",
    0,
    "0",
  ].map(keyfy)
);

const PROG_KEYS = new Set(
  [
    "in progress",
    "in_progress",
    "in-progress",
    "on progress",
    "ongoing",
    "processing",
    "doing",
    "wip",
    "progress",
    "started",
    "active",
    "sedangdikerjakan",
    1,
    "1",
  ].map(keyfy)
);

const DONE_KEYS = new Set(
  [
    "completed",
    "complete",
    "done",
    "finished",
    "closed",
    "resolved",
    "selesai",
    2,
    "2",
  ].map(keyfy)
);

const OVERDUE_KEYS = new Set(
  [
    "overdue",
    "late",
    "terlambat",
    "jatuh tempo",
    "lewat jatuh tempo",
    "jatuhtempo",
    "lewatjatuhtempo",
    3,
    "3",
  ].map(keyfy)
);

export default function TaskProgress({
  completed = 0,
  inProgress = 0,
  pending = 0,
  title = "Task Progress",

  tasks = null,
  apiUrl = "/api/tasks",
  queryParams = null,
  taskIds = null,
  useCountsDirect = false,

  idWorkspace = null,
}) {
  const [remoteTasks, setRemoteTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const wsId = useMemo(() => getWsId(), []);

  const queryObj = useMemo(() => {
    const hasWs = !!(
      queryParams &&
      Object.prototype.hasOwnProperty.call(queryParams, "idWorkspace")
    );

    const ws = hasWs ? undefined : idWorkspace ?? wsId;
    const base = ws != null ? { idWorkspace: ws } : {};

    return { ...base, ...(queryParams || {}) };
  }, [queryParams, idWorkspace, wsId]);

  const qs = useMemo(() => {
    const entries = Object.entries(queryObj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    );
    if (!entries.length) return "";
    return (
      "?" +
      entries
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
        )
        .join("&")
    );
  }, [queryObj]);

  useEffect(() => {
    const local = Array.isArray(tasks) ? tasks : [];
    if (local.length > 0 || useCountsDirect) {
      setRemoteTasks(null);
      setLoading(false);
      setErr("");
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    setErr("");
    const start = Date.now();

    (async () => {
      try {
        const resp = await fetch(`${apiUrl}${qs}`, {
          headers: { Accept: "application/json" },
          signal: ctrl.signal,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const arr = Array.isArray(data) ? data : data?.data || [];
        setRemoteTasks(arr);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(e?.message || "Gagal memuat tasks");
        }
      } finally {
        const elapsed = Date.now() - start;
        const finish = () => {
          if (!ctrl.signal.aborted) setLoading(false);
        };
        if (elapsed < MIN_SKEL_MS) {
          setTimeout(finish, MIN_SKEL_MS - elapsed);
        } else {
          finish();
        }
      }
    })();

    return () => ctrl.abort();
  }, [tasks, apiUrl, qs, useCountsDirect]);

  const srcTasks = useMemo(() => {
    if (useCountsDirect) return [];
    const base =
      Array.isArray(tasks) && tasks.length > 0 ? tasks : remoteTasks || [];
    if (!taskIds || taskIds.length === 0) return base;

    const allow = new Set(taskIds.map((x) => String(x)));
    return base.filter((t) => {
      const id = getId(t);
      return id != null && allow.has(String(id));
    });
  }, [tasks, remoteTasks, taskIds, useCountsDirect]);

  const sums = useMemo(() => {
    if (useCountsDirect) {
      return { pending, inProgress, completed };
    }

    let pend = 0;
    let prog = 0;
    let done = 0;
    const seen = new Set();

    for (const t of srcTasks) {
      const id = getId(t);
      if (id != null) {
        const sid = String(id);
        if (seen.has(sid)) continue;
        seen.add(sid);
      }

      const k = keyfy(getStatus(t));
      if (DONE_KEYS.has(k)) done++;
      else if (PROG_KEYS.has(k)) prog++;
      else if (OVERDUE_KEYS.has(k)) pend++;
      else if (NOT_KEYS.has(k)) pend++;
      else pend++;
    }

    return { pending: pend, inProgress: prog, completed: done };
  }, [srcTasks, useCountsDirect, pending, inProgress, completed]);

  const chartDone = sums.completed;
  const chartProg = sums.inProgress;
  const chartPend = sums.pending;

  const data = useMemo(
    () => [
      { name: "Completed", value: chartDone, color: "#673AB7" },
      { name: "In Progress", value: chartProg, color: "#341D5C" },
      { name: "Pending", value: chartPend, color: "#D9CEED" },
    ],
    [chartDone, chartProg, chartPend]
  );

  const total = Math.max(1, chartDone + chartProg + chartPend);
  const pct = Math.round((chartDone / total) * 100);
  const pctClamped = Math.max(0, Math.min(100, pct));

  const isFHD = useMediaQuery({ minWidth: 1536 });

  if (loading) {
    return (
      <>
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
            border-radius: 16px;
          }
          @keyframes gradia-shimmer-move {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>

        <div
          className="relative rounded-2xl p-4 h-[347px] 2xl:h-[440px]"
          role="status"
          aria-live="polite"
          aria-label="Loading task progress..."
          style={{
            width: "100%",
            backgroundImage: "linear-gradient(to right, #000000, #211832)",
            overflow: "hidden",
          }}
        >
          <div className="gradia-shimmer h-[347px] 2xl:h-[440px]" />
        </div>
      </>
    );
  }

  if (err) {
    return (
      <div
        className="relative rounded-2xl p-4 text-white w-full"
        style={{
          height: 347,
          backgroundImage: "linear-gradient(to right, #000000, #211832)",
        }}
      >
        <div className="h-[200px] flex items-center justify-center text-red-400">
          Gagal memuat: {err}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl p-4 text-white h-[347px] 2xl:h-[440px]"
      style={{
        width: "100%",
        backgroundImage: "linear-gradient(to right, #000000, #211832)",
      }}
    >
      <div
        className="mb-2 text-[20px] 2xl:text-[28px]"
        style={{
          fontFamily: "Montserrat, ui-sans-serif",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      {isFHD ? (
        <div className="relative" style={{ width: "100%", height: 300 }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
              transform: "translateY(20px)",
            }}
          >
            <PieChart width={400} height={180}>
              <Pie
                data={data}
                dataKey="value"
                startAngle={180}
                endAngle={0}
                innerRadius={65}
                outerRadius={110}
                cx="50%"
                cy="100%"
                paddingAngle={0}
                cornerRadius={10}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={`cell-${d.name}`} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </div>

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) translateY(50px)",
              zIndex: 99,
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Montserrat, ui-sans-serif",
                  fontSize: 48,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: "#FFFFFF",
                }}
              >
                {pctClamped}
              </span>
              <span
                style={{
                  fontFamily: "Montserrat, ui-sans-serif",
                  fontSize: 42,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#FFFFFF",
                }}
              >
                %
              </span>
            </div>
            <div
              style={{
                fontFamily: "Inter, ui-sans-serif",
                fontSize: 24,
                marginTop: 8,
                color: "#C4B5FD",
              }}
            >
              Task Completed
            </div>
          </div>
        </div>
      ) : (
        <div className="relative" style={{ width: "100%", height: 200 }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              position: "relative",
              zIndex: 1,
              transform: "translateY(20px)",
            }}
          >
            <PieChart width={250} height={140}>
              <Pie
                data={data}
                dataKey="value"
                startAngle={180}
                endAngle={0}
                innerRadius={65}
                outerRadius={110}
                cx="50%"
                cy="100%"
                paddingAngle={0}
                cornerRadius={20}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={`cell-${d.name}`} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </div>

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) translateY(50px)",
              zIndex: 99,
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Montserrat, ui-sans-serif",
                  fontSize: 42,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: "#FFFFFF",
                }}
              >
                {pctClamped}
              </span>
              <span
                style={{
                  fontFamily: "Montserrat, ui-sans-serif",
                  fontSize: 42,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#FFFFFF",
                }}
              >
                %
              </span>
            </div>
            <div
              style={{
                fontFamily: "Inter, ui-sans-serif",
                fontSize: 14,
                marginTop: 8,
                color: "#C4B5FD",
              }}
            >
              Task Completed
            </div>
          </div>
        </div>
      )}

      <div className="absolute left-4 right-4 text-sm" style={{ bottom: 20 }}>
        <div
          className="flex items-center justify-between"
          style={{ marginTop: 24 }}
        >
          {data.map((d) => (
            <div key={`legend-${d.name}`} className="flex items-center gap-2">
              <span
                className="inline-block w-3.5 h-3.5 2xl:w-5 2xl:h-5 rounded-full"
                style={{ background: d.color }}
              />
              <span
                style={{ fontFamily: "Inter, ui-sans-serif" }}
                className="text-gray-200 text-xs 2xl:text-[20px]"
              >
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

TaskProgress.propTypes = {
  completed: PropTypes.number,
  inProgress: PropTypes.number,
  pending: PropTypes.number,
  title: PropTypes.string,
  tasks: PropTypes.arrayOf(PropTypes.object),
  apiUrl: PropTypes.string,
  queryParams: PropTypes.object,
  taskIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  useCountsDirect: PropTypes.bool,
  idWorkspace: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
