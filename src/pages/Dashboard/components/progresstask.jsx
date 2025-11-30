import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const MIN_SKEL_MS = 200;

/* Helpers umum */
const getWsId = () => {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const v = Number(window.sessionStorage.getItem("id_workspace"));
      return Number.isFinite(v) && v > 0 ? v : 1;
    }
  } catch (err) {
    void err; // biar eslint diam
  }
  return 1;
};

const keyfy = (v) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? String(v) : String(v);
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
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

/* Status base */
const NOT_BASE = [
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
];

const PROG_BASE = [
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
];

const DONE_BASE = [
  "completed",
  "complete",
  "done",
  "finished",
  "closed",
  "resolved",
  "selesai",
  2,
  "2",
];

const OVERDUE_BASE = [
  "overdue",
  "late",
  "terlambat",
  "jatuh tempo",
  "lewat jatuh tempo",
  3,
  "3",
];

export default function TaskSummary({
  tasks = [],
  taskIds = null,
  apiUrl = "/api/tasks",
  queryParams = null,
  idWorkspace = null,
}) {
  const [remoteTasks, setRemoteTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const wsId = useMemo(() => getWsId(), []);

  const NOT_KEYS = useMemo(() => new Set(NOT_BASE.map(keyfy)), []);
  const PROG_KEYS = useMemo(() => new Set(PROG_BASE.map(keyfy)), []);
  const DONE_KEYS = useMemo(() => new Set(DONE_BASE.map(keyfy)), []);
  const OVERDUE_KEYS = useMemo(() => new Set(OVERDUE_BASE.map(keyfy)), []);

  const queryObj = useMemo(() => {
    const hasWs =
      queryParams &&
      Object.prototype.hasOwnProperty.call(queryParams, "idWorkspace");

    const ws = hasWs ? undefined : idWorkspace ?? wsId;
    const base = ws != null ? { idWorkspace: ws } : {};

    return {
      ...base,
      ...(queryParams || {}),
    };
  }, [queryParams, idWorkspace, wsId]);

  const qs = useMemo(() => {
    const entries = Object.entries(queryObj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    );

    if (!entries.length) return "";

    const str = entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");

    return `?${str}`;
  }, [queryObj]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setRemoteTasks(null);
      setLoading(false);
      setErr("");
      return;
    }

    const ctrl = new AbortController();
    const start = Date.now();

    setLoading(true);
    setErr("");

    (async () => {
      try {
        const resp = await fetch(`${apiUrl}${qs}`, {
          headers: { Accept: "application/json" },
          signal: ctrl.signal,
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        const data = await resp.json();
        const list = Array.isArray(data) ? data : data?.data || [];
        setRemoteTasks(list);
      } catch (e) {
        if (e?.name !== "AbortError") {
          setErr(e?.message || "Gagal memuat tasks");
        }
      } finally {
        const elapsed = Date.now() - start;

        const finish = () => {
          if (!ctrl.signal.aborted) {
            setLoading(false);
          }
        };

        if (elapsed < MIN_SKEL_MS) {
          setTimeout(finish, MIN_SKEL_MS - elapsed);
        } else {
          finish();
        }
      }
    })();

    return () => ctrl.abort();
  }, [apiUrl, qs, tasks?.length]);

  const srcTasks = useMemo(() => {
    const base = tasks && tasks.length > 0 ? tasks : remoteTasks || [];

    if (!taskIds || taskIds.length === 0) return base;

    const allow = new Set(taskIds.map((x) => String(x)));

    return base.filter((t) => {
      const id = getId(t);
      return id != null && allow.has(String(id));
    });
  }, [tasks, remoteTasks, taskIds]);

  const sum = useMemo(() => {
    let pend = 0;
    let prog = 0;
    let done = 0;

    const seen = new Set();

    for (const t of srcTasks) {
      const id = getId(t);
      const raw = getStatus(t);
      const k = keyfy(raw);

      if (id != null) {
        const sid = String(id);
        if (seen.has(sid)) continue;
        seen.add(sid);
      }

      if (DONE_KEYS.has(k)) done += 1;
      else if (PROG_KEYS.has(k)) prog += 1;
      else if (OVERDUE_KEYS.has(k)) pend += 1;
      else if (NOT_KEYS.has(k)) pend += 1;
      else pend += 1;
    }

    return { pending: pend, inProgress: prog, completed: done };
  }, [srcTasks, DONE_KEYS, PROG_KEYS, OVERDUE_KEYS, NOT_KEYS]);

  const cards = [
    { label: "Tasks Pending", value: sum.pending, width: 231 },
    { label: "Tasks On Progress", value: sum.inProgress, width: 251 },
    { label: "Tasks Completed", value: sum.completed, width: 231 },
  ];

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

        <div
          className="flex justify-start gap-4 flex-wrap"
          role="status"
          aria-live="polite"
          aria-label="Loading..."
        >
          <span className="sr-only">Loading...</span>
          {cards.map((card, idx) => (
            <div
              key={idx}
              style={{
                width: `${card.width}px`,
                height: "161px",
                fontFamily: "Montserrat, sans-serif",
                borderColor: "rgba(70,70,70,0.5)",
                backgroundImage: "linear-gradient(to bottom, #070707, #141414)",
                position: "relative",
                overflow: "hidden",
              }}
              className="rounded-2xl border bg-clip-padding"
            >
              <div className="gradia-shimmer" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-[#46464680] bg-gradient-to-b from-[#070707] to-[#141414] p-4 text-red-400">
        Gagal memuat tasks: {err}
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-4 flex-wrap">
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            width: `${card.width}px`,
            height: "161px",
            fontFamily: "Montserrat, sans-serif",
            borderColor: "rgba(70,70,70,0.5)",
            backgroundImage: "linear-gradient(to bottom, #070707, #141414)",
          }}
          className="rounded-2xl border bg-clip-padding"
        >
          <div className="h-full p-5 flex flex-col items-start text-left">
            <p className="text-white text-[20px] leading-none font-semibold">
              {card.label}
            </p>
            <span className="mt-4 text-[#FFEB3B] text-[64px] leading-none font-bold">
              {card.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

TaskSummary.propTypes = {
  tasks: PropTypes.array,
  taskIds: PropTypes.array,
  apiUrl: PropTypes.string,
  queryParams: PropTypes.object,
  idWorkspace: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
