import React, { useEffect, useMemo, useState } from "react";

/**
 * TaskSummary
 * Props:
 * - tasks?: Array<any>            // kalau ada, tidak akan fetch
 * - taskIds?: Array<string|number>// opsional: filter hanya task ID ini (berlaku untuk props & hasil fetch)
 * - apiUrl?: string               // default '/api/tasks'
 * - queryParams?: object          // opsional: tambahkan query (?workspaceId=1, dsb)
 */
export default function TaskSummary({
  tasks = [],
  taskIds = null,
  apiUrl = "/api/tasks",
  queryParams = null,
}) {
  const [remoteTasks, setRemoteTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ==== Helper normalisasi ====
  const keyfy = (v) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "number" ? String(v) : String(v);
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
  };

  const extractStatus = (t) => {
    if (!t) return "";
    // Coba berbagai bentuk field & nested
    if (t.status && typeof t.status === "object" && "name" in t.status) return t.status.name;
    if (t.status !== undefined) return t.status;
    if (t.statusId !== undefined) return t.statusId;
    if (t.state && typeof t.state === "object" && "name" in t.state) return t.state.name;
    if (t.state !== undefined) return t.state;
    if (t.status_name !== undefined) return t.status_name;
    return "";
  };

  const extractId = (t) => {
    // “menggunakan id.task untuk perhitungan”
    // Coba berbagai kemungkinan nama kolom id
    return (
      t?.id?.task ??
      t?.id_task ??
      t?.task_id ??
      t?.id ??
      null
    );
  };

  // ==== Kumpulan kunci status ====
  const NOT_STARTED_KEYS = new Set(
    [
      "not started", "not_started", "not-started", "todo", "to do", "pending",
      "backlog", "new", "open", "ready", "queued", "created", "belummulai",
      0, "0"
    ].map(keyfy)
  );

  const INPROGRESS_KEYS = new Set(
    [
      "in progress", "in_progress", "in-progress", "on progress", "ongoing",
      "processing", "doing", "wip", "progress", "started", "active",
      "sedangdikerjakan", 1, "1"
    ].map(keyfy)
  );

  const COMPLETED_KEYS = new Set(
    [
      "completed", "complete", "done", "finished", "closed", "resolved",
      "selesai", 2, "2"
    ].map(keyfy)
  );

  const OVERDUE_KEYS = new Set(
    [
      "overdue", "late", "terlambat", "jatuh tempo", "lewat jatuh tempo",
      3, "3"
    ].map(keyfy)
  );

  // ==== Fetch jika props.tasks kosong ====
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setRemoteTasks(null);
      setLoading(false);
      setErr("");
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setErr("");

        const qs = queryParams
          ? "?" +
            Object.entries(queryParams)
              .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
              .join("&")
          : "";

        const resp = await fetch(`${apiUrl}${qs}`, { headers: { "Accept": "application/json" } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (!cancelled) setRemoteTasks(Array.isArray(data) ? data : data?.data || []);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Gagal memuat tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, JSON.stringify(queryParams), tasks?.length]);

  // ==== Sumber data final ====
  const sourceTasks = useMemo(() => {
    const base = (tasks && tasks.length > 0) ? tasks : (remoteTasks || []);
    if (!taskIds || taskIds.length === 0) return base;

    const allow = new Set(taskIds.map((x) => String(x)));
    return base.filter((t) => {
      const id = extractId(t);
      return id != null && allow.has(String(id));
    });
  }, [tasks, remoteTasks, taskIds]);

  // ==== Ringkasan ====
  const summary = useMemo(() => {
    let pending = 0;      // Not Started + Overdue
    let inProgress = 0;   // In Progress
    let completed = 0;    // Completed

    // Hindari duplikasi jika ada task ganda; pakai id.task sebagai key
    const seen = new Set();

    for (const t of sourceTasks) {
      const id = extractId(t);
      const raw = extractStatus(t);
      const k = keyfy(raw);

      // Skip jika id sudah dilihat (menggunakan id.task)
      if (id != null) {
        const sid = String(id);
        if (seen.has(sid)) continue;
        seen.add(sid);
      }

      if (COMPLETED_KEYS.has(k)) {
        completed++;
      } else if (INPROGRESS_KEYS.has(k)) {
        inProgress++;
      } else if (OVERDUE_KEYS.has(k)) {
        pending++; // Overdue ikut Pending
      } else if (NOT_STARTED_KEYS.has(k)) {
        pending++;
      } else {
        // default tidak dikenal -> anggap Pending
        pending++;
      }
    }

    return { pending, inProgress, completed };
  }, [sourceTasks]);

  // ==== UI (dipertahankan) ====
  const cards = [
    { label: "Tasks Pending", value: summary.pending, width: 231, high: 177 },
    { label: "Tasks On Progress", value: summary.inProgress, width: 251, high: 177 },
    { label: "Tasks Completed", value: summary.completed, width: 231, high: 177 },
  ];

  if (loading) {
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
            className="rounded-2xl border bg-clip-padding animate-pulse"
          >
            <div className="h-full p-5 flex flex-col items-start text-left">
              <p className="text-white/60 text-[20px] leading-none font-semibold">
                {card.label}
              </p>
              <span className="mt-4 text-[#FFEB3B]/60 text-[64px] leading-none font-bold">
                …
              </span>
            </div>
          </div>
        ))}
      </div>
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
