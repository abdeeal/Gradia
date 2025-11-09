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

export default function TotalTask({ apiUrl = "/api/tasks" }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  const fetchTasks = async (signal) => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await fetch(apiUrl, { signal });
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
  }, [apiUrl]);

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
          style={{
            width: 32,
            height: 32,
            background: "#FAFAFA",
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

      {/* Body */}
      {loading ? (
        <div style={{ marginTop: 32 }}>
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
            Loading today’s tasks…
          </p>
        </div>
      ) : errMsg ? (
        <div style={{ marginTop: 24 }}>
          <p className="text-red-200 text-sm">{errMsg}</p>
          <button
            onClick={() => fetchTasks()}
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
