import React, { useEffect, useMemo, useState } from "react";

/**
 * Helper: cek sama hari (lokal).
 */
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

/**
 * Helper: normalisasi "status completed".
 * Mengembalikan true jika task dianggap selesai.
 * - status string mengandung "complete"/"done"/"finished"
 * - atau ada boolean completed === true
 * - atau progress === 100 (kalau ada)
 */
function isTaskCompleted(t = {}) {
  const s = String(t.status || t.state || "").toLowerCase();
  if (s.includes("complete") || s.includes("done") || s.includes("finish")) return true;
  if (t.completed === true) return true;
  if (typeof t.progress === "number" && t.progress >= 100) return true;
  return false;
}

/**
 * Helper: ambil tanggal selesai task.
 * Urutan prioritas field tanggal yang sering dipakai.
 */
function getCompletedDate(t = {}) {
  return (
    t.completed_at ||
    t.completedAt ||
    t.done_at ||
    t.doneAt ||
    t.finished_at ||
    t.finishedAt ||
    // Fallback terakhir: kalau tidak ada completed date, pakai updated_at ketika statusnya completed
    (isTaskCompleted(t) ? (t.updated_at || t.updatedAt) : null)
  );
}

export default function TotalTask({
  apiUrl = "/api/tasks",
  onOpen,
  // optional overrides kalau mau diisi manual
  totalOverride = null,
  todayCompletedOverride = null,
}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const fetchTasks = async (signal) => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await fetch(apiUrl, { signal });
      if (!res.ok) {
        throw new Error(`Gagal memuat tasks (${res.status})`);
      }
      const data = await res.json();
      // Asumsikan data bisa berupa { data: [...] } atau langsung array
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setTasks(list);
    } catch (e) {
      if (e.name !== "AbortError") {
        setErrMsg(e.message || "Terjadi kesalahan saat memuat data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks(controller.signal);
    return () => controller.abort();
  }, [apiUrl]);

  const { total, todayCompleted } = useMemo(() => {
    if (totalOverride != null && todayCompletedOverride != null) {
      return {
        total: Number(totalOverride) || 0,
        todayCompleted: Number(todayCompletedOverride) || 0,
      };
    }
    const all = Array.isArray(tasks) ? tasks : [];
    const today = new Date();
    const doneToday = all.filter((t) => {
      if (!isTaskCompleted(t)) return false;
      const doneAt = getCompletedDate(t);
      return doneAt ? isSameDay(doneAt, today) : false;
    }).length;

    return {
      total: all.length,
      todayCompleted: doneToday,
    };
  }, [tasks, totalOverride, todayCompletedOverride]);

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

        {/* Tombol ikon */}
        <button
          onClick={onOpen}
          aria-label="Open total tasks"
          className="flex items-center justify-center rounded-full transition"
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
        // Skeleton sederhana
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
            Loading today’s completed…
          </p>
        </div>
      ) : errMsg ? (
        // Error + retry
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
          {/* Angka */}
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

          {/* Keterangan */}
          <p
            style={{
              marginTop: 32,
              fontFamily: "Inter, ui-sans-serif",
              fontSize: 14,
              color: "#FCD34D", // amber-300
            }}
          >
            {todayCompleted} tasks completed today
          </p>
        </>
      )}
    </div>
  );
}
