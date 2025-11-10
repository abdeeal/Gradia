import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ==== Helper Functions ==== */
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
  idWorkspace = null,   // opsional override
  queryParams = null,   // opsional
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  // ==== idWorkspace dari sessionStorage (SSR/CSR-safe) ====
  const sessionIdWorkspace = React.useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const v = Number(window.sessionStorage.getItem("id_workspace"));
        return Number.isFinite(v) && v > 0 ? v : 1;
      }
    } catch {}
    return 1;
  }, []);

  // ==== Gabung query params (priority: queryParams > prop idWorkspace > session) ====
  const mergedQuery = useMemo(() => {
    const hasQP = !!(queryParams && Object.prototype.hasOwnProperty.call(queryParams, "idWorkspace"));
    const effective = hasQP ? undefined : (idWorkspace ?? sessionIdWorkspace);
    const base = effective != null ? { idWorkspace: effective } : {};
    return { ...base, ...(queryParams || {}) };
  }, [queryParams, idWorkspace, sessionIdWorkspace]);

  const queryString = useMemo(() => {
    const entries = Object.entries(mergedQuery).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    );
    if (entries.length === 0) return "";
    return (
      "?" +
      entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    );
  }, [mergedQuery]);

  const fetchTasks = async (signal) => {
    setLoading(true);             // 🔴 tampilkan loader segera
    setErrMsg("");
    try {
      const res = await fetch(`${apiUrl}${queryString}`, { signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Gagal memuat tasks (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setTasks(list);
    } catch (e) {
      if (e.name !== "AbortError") setErrMsg(e.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(controller.signal);
    return () => controller.abort();
  }, [apiUrl, queryString]);

  const { total, todayAdded } = useMemo(() => {
    const all = Array.isArray(tasks) ? tasks : [];
    const today = new Date();
    const addedToday = all.filter((t) => t.created_at && isSameDay(t.created_at, today)).length;
    return { total: all.length, todayAdded: addedToday };
  }, [tasks]);

  return (
    <div
      className="relative rounded-2xl text-white shadow border border-white/5"
      style={{
        height: 254,
        padding: 20,
        backgroundImage: "linear-gradient(to bottom right, #34146C, #28073B)",
      }}
    >
      {/* Header */}
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

        {/* Tombol navigasi ke /tasks */}
        <button
          onClick={() => navigate("/tasks")}
          aria-label="Go to Tasks page"
          className="flex items-center justify-center rounded-full transition hover:brightness-90"
          style={{ width: 32, height: 32, background: "#FAFAFA" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg" width="24" height="24"
            viewBox="0 0 24 24" fill="none" stroke="#000000"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ marginTop: 32 }} role="status" aria-live="polite" aria-label="Loading...">
          <div className="animate-pulse">
            <div className="h-16 w-40 bg-white/20 rounded-md" />
          </div>
          <p
            style={{
              marginTop: 32,
              fontFamily: "Inter, ui-sans-serif",
              fontSize: 14,
              color: "#FCD34D",
            }}
          >
            Loading...
          </p>
        </div>
      ) : errMsg ? (
        <div style={{ marginTop: 24 }}>
          <p className="text-red-200 text-sm">{errMsg}</p>
          <button
            onClick={() => {
              const controller = new AbortController();
              fetchTasks(controller.signal);
            }}
            className="mt-3 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Angka total */}
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

          {/* Keterangan bawah */}
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
        </>
      )}
    </div>
  );
}
