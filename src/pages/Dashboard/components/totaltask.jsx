import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

/* ==== Konstanta ==== */
const MIN_SKEL_MS = 200;

const CARD_CLASS = "relative rounded-2xl text-white shadow border border-white/5";
const CARD_STYLE = {
  height: 254,
  padding: 20,
  backgroundImage: "linear-gradient(to bottom right, #34146C, #28073B)",
};

/* ==== Helper ==== */
function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export default function TotalTask({
  apiUrl = "/api/tasks",
  idWorkspace = null,
  queryParams = null,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const nav = useNavigate();

  const wsId = useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const v = Number(window.sessionStorage.getItem("id_workspace"));
        return Number.isFinite(v) && v > 0 ? v : 1;
      }
    } catch {
      // fallback 1
    }
    return 1;
  }, []);

  const queryObj = useMemo(() => {
    const hasQP =
      !!(queryParams &&
        Object.prototype.hasOwnProperty.call(queryParams, "idWorkspace"));
    const ws = hasQP ? undefined : idWorkspace ?? wsId;
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

  const fetchData = useCallback(
    async (signal) => {
      setLoading(true);
      setErrMsg("");
      const start = Date.now();

      try {
        const res = await fetch(`${apiUrl}${qs}`, {
          signal,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`Gagal memuat tasks (${res.status})`);

        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setTasks(list);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErrMsg(e.message || "Terjadi kesalahan saat memuat data.");
        }
      } finally {
        const elapsed = Date.now() - start;
        const finish = () => {
          if (!signal.aborted) setLoading(false);
        };
        if (elapsed < MIN_SKEL_MS) {
          setTimeout(finish, MIN_SKEL_MS - elapsed);
        } else {
          finish();
        }
      }
    },
    [apiUrl, qs]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData]);

  const { total, todayAdded } = useMemo(() => {
    const all = Array.isArray(tasks) ? tasks : [];
    const now = new Date();
    const addedToday = all.filter(
      (t) => t.created_at && isSameDay(t.created_at, now)
    ).length;
    return { total: all.length, todayAdded: addedToday };
  }, [tasks]);

  /* LOADING */
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
              rgba(250, 250, 250, 0.25) 50%,
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
          className={CARD_CLASS}
          role="status"
          aria-live="polite"
          aria-label="Loading total tasks..."
          style={{ ...CARD_STYLE, overflow: "hidden" }}
        >
          <div className="gradia-shimmer" />
        </div>
      </>
    );
  }

  /* ERROR */
  if (errMsg) {
    return (
      <div className={CARD_CLASS} style={CARD_STYLE}>
        <div className="flex items-center justify-between">
          <h3
            style={{
              fontFamily: "Montserrat, ui-sans-serif",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Total Tasks
          </h3>

          <button
            onClick={() => nav("/tasks")}
            aria-label="Go to Tasks page"
            className="flex items-center justify-center rounded-full transition hover:brightness-90"
            style={{
              width: 32,
              height: 32,
              background: "#FAFAFA",
              cursor: "pointer",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </button>
        </div>

        <div style={{ marginTop: 24 }}>
          <p className="text-red-200 text-sm">{errMsg}</p>
          <button
            onClick={() => {
              const ctrl = new AbortController();
              fetchData(ctrl.signal);
            }}
            className="mt-3 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* NORMAL */
  return (
    <div className={CARD_CLASS} style={CARD_STYLE}>
      <div className="flex items-center justify-between">
        <h3
          style={{
            fontFamily: "Montserrat, ui-sans-serif",
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          Total Tasks
        </h3>

        <button
          onClick={() => nav("/tasks")}
          aria-label="Go to Tasks page"
          className="flex items-center justify-center rounded-full transition hover:brightness-90"
          style={{
            width: 32,
            height: 32,
            background: "#FAFAFA",
            cursor: "pointer",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </button>
      </div>

      <div style={{ marginTop: 32 }}>
        <span
          style={{
            fontFamily: "Montserrat, ui-sans-serif",
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {total}
        </span>
      </div>

      <p
        style={{
          marginTop: 32,
          fontFamily: "Inter, ui-sans-serif",
          fontSize: 14,
          color: "#FCD34D",
        }}
      >
        {todayAdded} new {todayAdded === 1 ? "task" : "tasks"} added today
      </p>
    </div>
  );
}

TotalTask.propTypes = {
  apiUrl: PropTypes.string,
  idWorkspace: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  queryParams: PropTypes.object,
};
