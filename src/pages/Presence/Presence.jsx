// src/pages/Presence/index.jsx
import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../../components/Sidebar.jsx";
import PresenceCard from "./components/PresenceCard.jsx";
import PresenceTable from "./components/PresenceTable.jsx";
import AddPresence from "./components/AddPresence.jsx";
import EditPresence from "./components/EditPresence.jsx";
import Mobile from "./layouts/Mobile.jsx";
import { useMediaQuery } from "react-responsive";
import {
  prewarmRooms,
  getRoom,
  peekRoom,
  setRoom,
} from "@/utils/coursesRoomCache";
import { getWorkspaceId } from "../../components/GetWorkspace.js";

/* ---------- Workspace ---------- */
const WORKSPACE_ID = getWorkspaceId();
const idWorkspace = WORKSPACE_ID;

/* ---------- Helpers tanggal/waktu ---------- */
const pad2 = (n) => String(n).padStart(2, "0");

const fmtDate = (d) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const fmtTime = (d) =>
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

/* ---------- Range helper ---------- */
function getRange(str) {
  if (!str) return null;
  const [s, e] = str.split("-").map((x) => x?.trim());
  if (!s || !e) return null;

  const [sh, sm] = s.split(":").map((x) => parseInt(x, 10));
  const [eh, em] = e.split(":").map((x) => parseInt(x, 10));

  const now = new Date();

  const start = new Date(now);
  start.setHours(sh || 0, sm || 0, 0, 0);

  const end = new Date(now);
  end.setHours(eh || 0, em || 0, 0, 0);

  return { start, end };
}

/* ---------- Status ---------- */
function getStatus(str) {
  const r = getRange(str);
  if (!r) return "Upcoming";

  const now = new Date();
  if (now < r.start) return "Upcoming";
  if (now <= r.end) return "On Going";
  return "Overdue";
}

/* ---------- JSON Helper (aman, tidak lempar error) ---------- */
async function json(res) {
  if (!res) return null;

  const type = res.headers.get("content-type") || "";

  // Kalau benar-benar JSON (boleh ada charset)
  if (type.includes("application/json")) {
    try {
      return await res.json();
    } catch (e) {
      console.error("Gagal parse JSON:", e);
      return null;
    }
  }

  // Kalau bukan JSON (misroute ke index.html, error page, dll)
  const txt = await res.text();

  // Pakai debug supaya tidak terlalu mengganggu
  console.debug("Expected JSON, got non-JSON response:", {
    status: res.status,
    contentType: type,
    preview: txt.slice(0, 200),
  });

  // Biarkan caller handle `null`
  return null;
}

/* ---------- Status normalizer ---------- */
const normStatus = (s) => {
  const v = String(s || "").trim().toLowerCase();
  return v === "presence" ? "present" : v;
};

const isNumId = (v) => /^\d+$/.test(String(v).trim());

/* ---------- No-op helper (untuk onAppendLog) ---------- */
const noop = () => null;

/* ---------- Map row dari DB ---------- */
function mapRow(row) {
  const dt = row.presences_at ? new Date(row.presences_at) : null;
  return {
    id: row.id_presence,
    id_presence: row.id_presence,
    courseId: row.id_course,
    courseTitle: row.course_name || "-",
    room: row.course_room || "-",
    datetime: dt ? `${fmtDate(dt)} ${fmtTime(dt)}` : "",
    status: row.status || "",
    note: row.note || "",
    _raw: row,
  };
}

/* ---------- Format jam ---------- */
const fmtHM = (v) => {
  if (!v) return "";
  const t = String(v).trim().replace(".", ":");
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));

  if (!Number.isFinite(h)) return "";

  const hh = pad2(Math.max(0, Math.min(23, h)));
  const mm = pad2(Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0);
  return `${hh}:${mm}`;
};

/* ---------- Immutable helpers ---------- */
function setRow(list, rec) {
  if (!rec) return list;
  const id = rec.id_presence || rec.id;
  const idx = list.findIndex((x) => (x.id_presence || x.id) === id);
  if (idx === -1) return [...list, rec];

  const next = list.slice();
  next[idx] = { ...next[idx], ...rec };
  return next;
}

function swapId(list, tempId, realId) {
  const idx = list.findIndex((x) => (x.id || x.id_presence) === tempId);
  if (idx === -1) return list;

  const next = list.slice();
  next[idx] = { ...next[idx], id: realId, id_presence: realId };
  return next;
}

/* ---------- Fetch courses today ---------- */
async function fetchToday() {
  try {
    const r = await fetch(`/api/courses?q=today&idWorkspace=${idWorkspace}`);
    const data = await json(r);

    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : [];

    const mapped = arr.map((c) => {
      const id =
        c.id_courses ??
        c.id_course ??
        c.course_id ??
        c.id ??
        c.courseId;

      const title = c.name ?? c.title ?? c.course_name ?? "-";
      const room = c.room ?? c.course_room ?? "";

      const start = fmtHM(
        c.start ?? c.course_start ?? c.time?.split("-")?.[0]
      );
      const end = fmtHM(c.end ?? c.course_end ?? c.time?.split("-")?.[1]);

      const amp = start && end ? `${start} & ${end}` : start || end || "";
      const dash = start && end ? `${start} - ${end}` : start || end || "";

      return {
        id,
        title,
        room,
        start,
        end,
        time: amp,
        status: getStatus(dash),
      };
    });

    prewarmRooms(mapped.map((c) => ({ id: c.id, room: c.room })));

    const done = await Promise.all(
      mapped.map(async (c) => {
        let room = c.room;
        if (!room) {
          try {
            room = await getRoom(c.id);
          } catch (e) {
            console.error(e);
            room = "";
          }
        }
        setRoom(c.id, room || "");
        return { ...c, room: room || "-" };
      })
    );

    return done;
  } catch (e) {
    console.error("fetchToday error:", e);
    return [];
  }
}

/* ===========================================================
   COMPONENT UTAMA
   =========================================================== */
function Presence() {
  const [rows, setRows] = useState([]);
  const [coursesToday, setCoursesToday] = useState([]);
  const [initialLoading, setInitialLoading] = useState(false);

  const [totals, setTotals] = useState({ presence: 0, absent: 0 });

  /* ---------- Hitung totals dari rows ---------- */
  useEffect(() => {
    let p = 0;
    let a = 0;
    for (const r of rows) {
      const s = normStatus(r.status);
      if (s === "present") p++;
      else if (s === "absent") a++;
    }
    setTotals({ presence: p, absent: a });
  }, [rows]);

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  
  /* ---------- Fetch totals dari API ---------- */
  const fetchTotals = useCallback(async () => {
    const tryStats = async () => {
      try {
        const r = await fetch(
          `/api/presences/stats?idWorkspace=${idWorkspace}`
        );
        if (r.ok) {
          const data = await json(r);
          if (data && typeof data === "object") {
            const presence = Number(
              data.totalPresence ??
              data.presence ??
              data.present ??
              0
            );
            const absent = Number(
              data.totalAbsent ??
              data.absent ??
              data.absence ??
              0
            );
            return { ok: true, presence, absent };
          }
        }
      } catch (e) {
        console.error(e);
      }
      return { ok: false };
    };
    
    const tryList = async () => {
      const urls = [
        `/api/presences?limit=100000&idWorkspace=${idWorkspace}`,
        `/api/presences?idWorkspace=${idWorkspace}`,
      ];
      
      for (const u of urls) {
        try {
          const r = await fetch(u);
          if (r.ok) {
            const arr = await json(r);
            if (Array.isArray(arr)) {
              let p = 0;
              let a = 0;
              for (const it of arr) {
                const s = normStatus(it.status);
                if (s === "present") p++;
                else if (s === "absent") a++;
              }
              return { ok: true, presence: p, absent: a };
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      return { ok: false };
    };
    
    let x = await tryStats();
    if (!x.ok) x = await tryList();
    
    if (x.ok) {
      setTotals({ presence: x.presence, absent: x.absent });
    }
  }, []);
  
  /* ---------- Initial fetch ---------- */
  const fetchInitial = useCallback(async () => {
    setInitialLoading(true);
    try {
      const [presR, today] = await Promise.all([
        fetch(`/api/presences?idWorkspace=${idWorkspace}`),
        fetchToday(),
      ]);
      
      const presRaw = await json(presR);
      const mapped = (Array.isArray(presRaw) ? presRaw : []).map(mapRow);
      
      const merged = mapped.map((r) => {
        if (r.room && r.room !== "-") return r;
        const c = today.find((x) => x.id === r.courseId);
        return { ...r, room: c?.room || r.room || "-" };
      });
      
      setRows(merged);
      setCoursesToday(today);
    } catch (e) {
      console.error(e);
      setRows([]);
      setCoursesToday([]);
    } finally {
      setInitialLoading(false);
      fetchTotals();
    }
  }, [fetchTotals]);
  
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);
  
  /* ---------- Update status tiap 30 detik ---------- */
  useEffect(() => {
    const t = setInterval(() => {
      setCoursesToday((prev) =>
        prev.map((c) => {
          const dash =
          c.start && c.end ? `${c.start} - ${c.end}` : c.start || c.end || "";
          return { ...c, status: getStatus(dash) };
        })
      );
      fetchTotals();
    }, 30000);
    
    return () => clearInterval(t);
  }, [fetchTotals]);
  
  /* ---------- Add Presence ---------- */
  const handleAdd = async ({ courseId, status, note }) => {
    const now = new Date();
    const tempId =
    "temp-" + now.getTime() + "-" + Math.random().toString(36).slice(2, 7);
    
    const meta = coursesToday.find((c) => c.id === courseId);
    
    const optimistic = {
      id: tempId,
      id_presence: tempId,
      courseId,
      courseTitle: meta?.title || "-",
      room: meta?.room || peekRoom(courseId) || "-",
      datetime: `${fmtDate(now)} ${fmtTime(now)}`,
      status,
      note: note || "",
      _raw: null,
    };
    
    setRows((prev) => setRow(prev, optimistic));
    
    try {
      const res = await fetch(`/api/presences?idWorkspace=${idWorkspace}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_course: courseId,
          status,
          note,
          id_workspace: idWorkspace,
        }),
      });
      
      if (res.ok) {
        const body = await json(res);
        const realId = body?.id_presence || body?.id;
        if (realId) {
          setRows((prev) => swapId(prev, tempId, realId));
        }
        fetchTotals();
      } else {
        setRows((prev) => prev.filter((r) => r.id !== tempId));
      }
    } catch (e) {
      console.error(e);
      setRows((prev) => prev.filter((r) => r.id !== tempId));
    }
  };
  
  /* ---------- Edit Presence ---------- */
  const handleEdit = async (u) => {
    const rawId = u.id_presence ?? u.id;
    const idStr = String(rawId).trim();
    
    if (!isNumId(idStr)) return false;
    
    const prevSnap = rows.find(
      (r) => String(r.id_presence || r.id) === idStr
    );
    if (!prevSnap) return false;
    
    const resolvedRoom =
    (u.room && u.room.trim() !== "" ? u.room : null) ??
    peekRoom(u.courseId) ??
    prevSnap.room ??
    "-";
    
    const updated = {
      ...prevSnap,
      status: u.status,
      note: u.note ?? prevSnap.note ?? "",
      room: resolvedRoom,
    };
    
    setRows((prev) => setRow(prev, updated));
    
    try {
      const res = await fetch(`/api/presences?idWorkspace=${idWorkspace}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_presence: idStr,
          id_course: u.courseId,
          status: u.status,
          note: u.note,
        }),
      });
      
      if (!res.ok) {
        setRows((prev) => setRow(prev, prevSnap));
        return false;
      }
      
      fetchTotals();
      return true;
    } catch (e) {
      console.error(e);
      setRows((prev) => setRow(prev, prevSnap));
      return false;
    }
  };
  
  /* ---------- UI State ---------- */
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  
  if (isMobile || isTablet) return <Mobile />;
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 font-[Inter]">
        <div className="w-full pt-6">
          <header className="mb-6">
            <h1 className="font-semibold text-foreground font-[Montserrat] text-[20px]">
              Presence
            </h1>
            <p className="text-foreground-secondary mt-1 font-[Montserrat] text-[16px]">
              Monitor and manage attendance records with access to presence logs.
            </p>
          </header>

          <section className="mb-6">
            <PresenceCard
              courses={coursesToday}
              rows={rows}
              onOpenAddPresence={setSelectedCourse}
              totalsTodayOverride={totals}
              /* 🔥 loading dioper ke PresenceCard */
              isLoading={initialLoading}
            />
          </section>

          <section>
            <PresenceTable
              rows={rows}
              isLoading={initialLoading}
              onRowClick={setEditingRow}
            />
          </section>
        </div>
      </main>

      {selectedCourse && (
        <AddPresence
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onLiveUpdate={({ courseId, statusSelection, note }) =>
            setCoursesToday((prev) =>
              prev.map((c) =>
                c.id === courseId ? { ...c, statusSelection, note } : c
              )
            )
          }
          onSubmit={handleAdd}
          onAppendLog={noop}
          contentPaddingLeft={272}
        />
      )}

      {editingRow && (
        <EditPresence
          record={editingRow}
          onClose={() => setEditingRow(null)}
          onSave={handleEdit}
          onAppendLog={noop}
          contentPaddingLeft={272}
        />
      )}
    </div>
  );
}

export default Presence;
