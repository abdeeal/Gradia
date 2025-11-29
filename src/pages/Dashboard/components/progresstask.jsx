// src/pages/Dashboard/components/progresstask.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const MIN_SKELETON_MS = 200; // skeleton minimal 200ms

/* ===== Helpers umum ===== */
const getSessionWorkspace = () => {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const v = Number(window.sessionStorage.getItem("id_workspace"));
      return Number.isFinite(v) && v > 0 ? v : 1;
    }
  } catch (err) {
    // sengaja diabaikan, fallback ke 1
    void err; // gunakan err supaya eslint no-unused-vars tidak protes
  }
  return 1;
};

const keyfy = (v) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "number" ? String(v) : String(v);
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
};

const extractStatus = (t) => {
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

const extractId = (t) => t?.id?.task ?? t?.id_task ?? t?.task_id ?? t?.id ?? null;

/* ===== Data status dasar ===== */
const NOT_STARTED_BASE = [
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

const INPROGRESS_BASE = [
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

const COMPLETED_BASE = [
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
  const [error, setError] = useState("");

  /* ===== idWorkspace dari sessionStorage (SSR-safe) ===== */
  const sessionIdWorkspace = useMemo(() => getSessionWorkspace(), []);

  /* ===== Kumpulan kunci status (dinormalisasi) ===== */
  const NOT_STARTED_KEYS = useMemo(
    () => new Set(NOT_STARTED_BASE.map(keyfy)),
    []
  );

  const INPROGRESS_KEYS = useMemo(
    () => new Set(INPROGRESS_BASE.map(keyfy)),
    []
  );

  const COMPLETED_KEYS = useMemo(
    () => new Set(COMPLETED_BASE.map(keyfy)),
    []
  );

  const OVERDUE_KEYS = useMemo(
    () => new Set(OVERDUE_BASE.map(keyfy)),
    []
  );

  /* ===== Gabung query params =====
   * Prioritas:
   * - queryParams.idWorkspace (jika ada)
   * - prop idWorkspace
   * - sessionIdWorkspace
   */
  const mergedQuery = useMemo(() => {
    const hasIdWorkspaceInQP =
      queryParams && Object.prototype.hasOwnProperty.call(queryParams, "idWorkspace");

    const effectiveWorkspace = hasIdWorkspaceInQP ? undefined : idWorkspace ?? sessionIdWorkspace;
    const base = effectiveWorkspace != null ? { idWorkspace: effectiveWorkspace } : {};

    return {
      ...base,
      ...(queryParams || {}),
    };
  }, [queryParams, idWorkspace, sessionIdWorkspace]);

  const queryString = useMemo(() => {
    const entries = Object.entries(mergedQuery).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    );

    if (entries.length === 0) return "";

    const qs = entries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");

    return `?${qs}`;
  }, [mergedQuery]);

  /* ===== Fetch tasks dari API kalau props.tasks kosong ===== */
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setRemoteTasks(null);
      setLoading(false);
      setError("");
      return;
    }

    const ctrl = new AbortController();
    const startTime = Date.now();

    setLoading(true);
    setError("");

    (async () => {
      try {
        const resp = await fetch(`${apiUrl}${queryString}`, {
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
          setError(e?.message || "Gagal memuat tasks");
        }
      } finally {
        const elapsed = Date.now() - startTime;

        const finish = () => {
          if (!ctrl.signal.aborted) {
            setLoading(false);
          }
        };

        if (elapsed < MIN_SKELETON_MS) {
          setTimeout(finish, MIN_SKELETON_MS - elapsed);
        } else {
          finish();
        }
      }
    })();

    return () => ctrl.abort();
  }, [apiUrl, queryString, tasks?.length]);

  /* ===== Sumber data final (props.tasks > remoteTasks) ===== */
  const sourceTasks = useMemo(() => {
    const base = tasks && tasks.length > 0 ? tasks : remoteTasks || [];

    if (!taskIds || taskIds.length === 0) return base;

    const allow = new Set(taskIds.map((x) => String(x)));

    return base.filter((t) => {
      const id = extractId(t);
      return id != null && allow.has(String(id));
    });
  }, [tasks, remoteTasks, taskIds]);

  /* ===== Hitung ringkasan status ===== */
  const summary = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;

    const seen = new Set();

    for (const t of sourceTasks) {
      const id = extractId(t);
      const rawStatus = extractStatus(t);
      const k = keyfy(rawStatus);

      if (id != null) {
        const sid = String(id);
        if (seen.has(sid)) continue;
        seen.add(sid);
      }

      if (COMPLETED_KEYS.has(k)) {
        completed += 1;
      } else if (INPROGRESS_KEYS.has(k)) {
        inProgress += 1;
      } else if (OVERDUE_KEYS.has(k)) {
        pending += 1;
      } else if (NOT_STARTED_KEYS.has(k)) {
        pending += 1;
      } else {
        pending += 1;
      }
    }

    return { pending, inProgress, completed };
  }, [sourceTasks, COMPLETED_KEYS, INPROGRESS_KEYS, OVERDUE_KEYS, NOT_STARTED_KEYS]);

  /* ===== Data card UI ===== */
  const cards = [
    { label: "Tasks Pending", value: summary.pending, width: 231, high: 177 },
    { label: "Tasks On Progress", value: summary.inProgress, width: 251, high: 177 },
    { label: "Tasks Completed", value: summary.completed, width: 231, high: 177 },
  ];

  /* ===== Loading state: shimmer ===== */
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

  /* ===== Error state ===== */
  if (error) {
    return (
      <div className="rounded-2xl border border-[#46464680] bg-gradient-to-b from-[#070707] to-[#141414] p-4 text-red-400">
        Gagal memuat tasks: {error}
      </div>
    );
  }

  /* ===== Normal state ===== */
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

/* ===== PropTypes (supaya eslint react/prop-types nggak marah) ===== */
TaskSummary.propTypes = {
  tasks: PropTypes.array,
  taskIds: PropTypes.array,
  apiUrl: PropTypes.string,
  queryParams: PropTypes.object,
  idWorkspace: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
