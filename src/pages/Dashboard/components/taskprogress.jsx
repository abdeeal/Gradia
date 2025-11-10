import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";

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

  idWorkspace = null, // opsional override
}) {
  const [remoteTasks, setRemoteTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // === idWorkspace dari sessionStorage (SSR/CSR-safe) ===
  const sessionIdWorkspace = React.useMemo(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        const v = Number(window.sessionStorage.getItem("id_workspace"));
        return Number.isFinite(v) && v > 0 ? v : 1;
      }
    } catch {}
    return 1;
  }, []);

  // ===== Normalisasi status & ID =====
  const keyfy = (v) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "number" ? String(v) : String(v);
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
  };

  const extractStatus = (t) => {
    if (!t) return "";
    if (t.status && typeof t.status === "object" && "name" in t.status) return t.status.name;
    if (t.status !== undefined) return t.status;
    if (t.statusId !== undefined) return t.statusId;
    if (t.state && typeof t.state === "object" && "name" in t.state) return t.state.name;
    if (t.state !== undefined) return t.state;
    if (t.status_name !== undefined) return t.status_name;
    return "";
  };

  const extractId = (t) => t?.id?.task ?? t?.id_task ?? t?.task_id ?? t?.id ?? null;

  const NOT_STARTED_KEYS = useMemo(
    () =>
      new Set(
        [
          "not started","not_started","not-started","todo","to do","pending","backlog","new","open","ready","queued","created","belummulai",0,"0"
        ].map(keyfy)
      ),
    []
  );
  const INPROGRESS_KEYS = useMemo(
    () =>
      new Set(
        [
          "in progress","in_progress","in-progress","on progress","ongoing","processing","doing","wip","progress","started","active","sedangdikerjakan",1,"1"
        ].map(keyfy)
      ),
    []
  );
  const COMPLETED_KEYS = useMemo(
    () => new Set(["completed","complete","done","finished","closed","resolved","selesai",2,"2"].map(keyfy)),
    []
  );
  const OVERDUE_KEYS = useMemo(
    () => new Set(["overdue","late","terlambat","jatuh tempo","lewat jatuh tempo","jatuhtempo","lewatjatuhtempo",3,"3"].map(keyfy)),
    []
  );

  // ==== Gabung query params (priority: queryParams > prop idWorkspace > session) ====
  const mergedQuery = useMemo(() => {
    const hasQP = !!(queryParams && Object.prototype.hasOwnProperty.call(queryParams, "idWorkspace"));
    const effective = hasQP ? undefined : (idWorkspace ?? sessionIdWorkspace);
    const base = effective != null ? { idWorkspace: effective } : {};
    return { ...base, ...(queryParams || {}) };
  }, [queryParams, idWorkspace, sessionIdWorkspace]);

  const queryString = useMemo(() => {
    const entries = Object.entries(mergedQuery).filter(([, v]) => v !== undefined && v !== null && v !== "");
    if (entries.length === 0) return "";
    return (
      "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&")
    );
  }, [mergedQuery]);

  // ===== Fetch jika tasks kosong / tidak pakai counts langsung =====
  useEffect(() => {
    const local = Array.isArray(tasks) ? tasks : [];
    if (local.length > 0 || useCountsDirect) {
      setRemoteTasks(null);
      setLoading(false);
      setErr("");
      return;
    }

    const ctrl = new AbortController();
    setLoading(true); // 🔴 aktifkan loader sebelum async
    setErr("");

    (async () => {
      try {
        const resp = await fetch(`${apiUrl}${queryString}`, {
          headers: { Accept: "application/json" },
          signal: ctrl.signal,
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const arr = Array.isArray(data) ? data : data?.data || [];
        setRemoteTasks(arr);
      } catch (e) {
        if (e.name !== "AbortError") setErr(e?.message || "Gagal memuat tasks");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [tasks, apiUrl, queryString, useCountsDirect]);

  // ===== Pilih sumber data =====
  const sourceTasks = useMemo(() => {
    if (useCountsDirect) return [];
    const base = (Array.isArray(tasks) && tasks.length > 0) ? tasks : (remoteTasks || []);
    if (!taskIds || taskIds.length === 0) return base;
    const allow = new Set(taskIds.map((x) => String(x)));
    return base.filter((t) => {
      const id = extractId(t);
      return id != null && allow.has(String(id));
    });
  }, [tasks, remoteTasks, taskIds, useCountsDirect]);

  // ===== Hitung angka untuk diagram =====
  const derived = useMemo(() => {
    if (useCountsDirect) {
      return { pending, inProgress, completed };
    }
    let pend = 0, prog = 0, comp = 0;
    const seen = new Set();
    for (const t of sourceTasks) {
      const id = extractId(t);
      if (id != null) {
        const sid = String(id);
        if (seen.has(sid)) continue;
        seen.add(sid);
      }
      const k = keyfy(extractStatus(t));
      if (COMPLETED_KEYS.has(k)) comp++;
      else if (INPROGRESS_KEYS.has(k)) prog++;
      else if (OVERDUE_KEYS.has(k)) pend++;
      else if (NOT_STARTED_KEYS.has(k)) pend++;
      else pend++;
    }
    return { pending: pend, inProgress: prog, completed: comp };
  }, [sourceTasks, useCountsDirect, pending, inProgress, completed, COMPLETED_KEYS, INPROGRESS_KEYS, OVERDUE_KEYS, NOT_STARTED_KEYS]);

  const chartCompleted = derived.completed;
  const chartInProgress = derived.inProgress;
  const chartPending = derived.pending;

  const data = useMemo(
    () => [
      { name: "Completed", value: chartCompleted, color: "#673AB7" },
      { name: "In Progress", value: chartInProgress, color: "#341D5C" },
      { name: "Pending", value: chartPending, color: "#D9CEED" },
    ],
    [chartCompleted, chartInProgress, chartPending]
  );

  const total = Math.max(1, chartCompleted + chartInProgress + chartPending);
  const pct = Math.round((chartCompleted / total) * 100);
  const pctClamped = Math.max(0, Math.min(100, pct));

  // ===== UI (tetap) =====
  if (loading) {
    // Saat fetch: tampilkan "..." sesuai request kamu sebelumnya
    return (
      <div
        className="relative rounded-2xl p-4 text-white"
        role="status"
        aria-live="polite"
        aria-label="Loading..."
        style={{ width: 308, height: 347, backgroundImage: "linear-gradient(to right, #000000, #211832)" }}
      >
        <div className="mb-2" style={{ fontFamily: "Montserrat, ui-sans-serif", fontSize: 20, fontWeight: 700 }}>
          {title}
        </div>
        <div className="h-[200px] flex items-center justify-center">
          <span className="text-4xl select-none">...</span>
        </div>
      </div>
    );
  }
  if (err) {
    return (
      <div
        className="relative rounded-2xl p-4 text-white"
        style={{ width: 308, height: 347, backgroundImage: "linear-gradient(to right, #000000, #211832)" }}
      >
        <div className="mb-2" style={{ fontFamily: "Montserrat, ui-sans-serif", fontSize: 20, fontWeight: 700 }}>
          {title}
        </div>
        <div className="h-[200px] flex items-center justify-center text-red-400">Gagal memuat: {err}</div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl p-4 text-white"
      style={{ width: 308, height: 347, backgroundImage: "linear-gradient(to right, #000000, #211832)" }}
    >
      <div className="mb-2" style={{ fontFamily: "Montserrat, ui-sans-serif", fontSize: 20, fontWeight: 700 }}>
        {title}
      </div>

      <div className="relative" style={{ width: "100%", height: 200 }}>
        <div style={{ width: "100%", display: "flex", justifyContent: "center", position: "relative", zIndex: 1, transform: "translateY(20px)" }}>
          <PieChart width={250} height={240}>
            <Pie
              data={data}
              dataKey="value"
              startAngle={190}
              endAngle={-10}
              innerRadius={65}
              outerRadius={110}
              cx="50%"
              cy="50%"
              paddingAngle={-25}
              cornerRadius={500}
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
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0 }}>
            <span style={{ fontFamily: "Montserrat, ui-sans-serif", fontSize: 42, fontWeight: 600, lineHeight: 1.5, color: "#FFFFFF" }}>
              {pctClamped}
            </span>
            <span style={{ fontFamily: "Montserrat, ui-sans-serif", fontSize: 42, fontWeight: 700, lineHeight: 1, color: "#FFFFFF" }}>
              %
            </span>
          </div>
          <div style={{ fontFamily: "Inter, ui-sans-serif", fontSize: 14, marginTop: 8, color: "#C4B5FD" }}>
            Task Completed
          </div>
        </div>
      </div>

      <div className="absolute left-4 right-4 text-sm" style={{ bottom: 20 }}>
        <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
          {data.map((d) => (
            <div key={`legend-${d.name}`} className="flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full" style={{ background: d.color }} />
              <span style={{ fontFamily: "Inter, ui-sans-serif" }} className="text-gray-200 text-xs">
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
