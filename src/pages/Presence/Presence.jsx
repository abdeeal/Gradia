// src/pages/Presence/index.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar.jsx";
import PresenceCard from "./components/PresenceCard.jsx";
import PresenceTable from "./components/PresenceTable.jsx";
import AddPresence from "./components/AddPresence.jsx";
import EditPresence from "./components/EditPresence.jsx";
import Mobile from "./layouts/Mobile.jsx";
import { useMediaQuery } from "react-responsive";
import { prewarmRooms, getRoom, peekRoom, setRoom } from "@/utils/coursesRoomCache";

const WORKSPACE_ID = 1;
const idWorkspace = sessionStorage.getItem("id_workspace");

/* ===== Helpers tanggal/status ===== */
const pad2 = (n) => String(n).padStart(2, "0");
const toDDMMYYYY = (d) =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
const toHHMMSS = (d) =>
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

function timeRangeStrFromApi(row) {
  const s = row.course_start ? new Date(row.course_start) : null;
  const e = row.course_end ? new Date(row.course_end) : null;
  if (!s || !e || isNaN(s) || isNaN(e)) return "";
  const sh = pad2(s.getHours()), sm = pad2(s.getMinutes());
  const eh = pad2(e.getHours()), em = pad2(e.getMinutes());
  return `${sh}:${sm} - ${eh}:${em}`;
}
function windowTodayFromRange(rangeStr) {
  if (!rangeStr) return null;
  const [s, e] = rangeStr.split("-").map((x) => x?.trim());
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
function statusFromNow(rangeStr) {
  const w = windowTodayFromRange(rangeStr);
  if (!w) return "Upcoming"; // tidak ada Not Started; treat as Upcoming
  const now = new Date();
  if (now < w.start) return "Upcoming";
  if (now <= w.end) return "On Going";
  return "Overdue";
}
async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON, got ${res.status} ${res.statusText}. First bytes: ${text.slice(0,200)}`
    );
  }
  return res.json();
}

/* Normalisasi status lama → baru */
const normStatus = (s) => {
  const v = String(s || "").trim().toLowerCase();
  return v === "presence" ? "present" : v;
};

/* Buat shape record untuk tabel */
function mapServerRow(row) {
  const dt = row.presences_at ? new Date(row.presences_at) : null;
  return {
    id: row.id_presence,
    id_presence: row.id_presence,
    courseId: row.id_course,
    courseTitle: row.course_name || "-",
    room: row.course_room || "-", // simpan room tapi tidak ditampilkan di tabel
    datetime: dt ? `${toDDMMYYYY(dt)} ${toHHMMSS(dt)}` : "",
    status: row.status || "",
    note: row.note || "",
    _raw: row,
  };
}

/* ===== Helpers waktu untuk course (HH:mm / HH.mm accepted) ===== */
const toHHMM = (v) => {
  if (!v) return "";
  const s = String(v).trim();
  if (!s) return "";
  const t = s.replace(".", ":"); // support "07.30"
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(h)) return "";
  const hh = pad2(Math.max(0, Math.min(23, h)));
  const mm = pad2(Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0);
  return `${hh}:${mm}`;
};

/* ===== Ambil daftar course today dari tabel courses ===== */
async function fetchCoursesToday() {
  try {
    const r = await fetch(`/api/courses?q=today&idWorkspace=${idWorkspace}`);
    const data = await safeJson(r);
    const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    // Map ke shape yang dipakai PresenceCard + kebutuhan logic lama
    const mapped = arr.map((c) => {
      const id = c.id ?? c.id_course ?? c.course_id;
      const title = c.name ?? c.title ?? c.course_name ?? "-";
      const room = c.room ?? c.course_room ?? "";
      const start = toHHMM(c.start ?? c.course_start ?? c.time?.split("-")?.[0]);
      const end   = toHHMM(c.end   ?? c.course_end   ?? c.time?.split("-")?.[1]);

      // time untuk UI: "HH:MM & HH:MM" (permintaanmu)
      const timeAmpersand = (start && end) ? `${start} & ${end}` : (start || end || "");

      // rangeDash hanya dipakai untuk perhitungan status oleh helper lama (TIDAK mengubah logic lain)
      const rangeDash = (start && end) ? `${start} - ${end}` : (start || end || "");

      return {
        id,
        title,
        room,
        // Kirim juga start/end agar PresenceCard bisa baca langsung
        start,
        end,
        // time untuk ditampilkan (punya "&")
        time: timeAmpersand,
        // status dihitung dengan logic lama
        status: statusFromNow(rangeDash),
      };
    });

    // Panaskan cache room; lengkapin room bila kosong
    prewarmRooms(mapped.map((c) => ({ id: c.id, room: c.room })));
    const completed = await Promise.all(
      mapped.map(async (c) => {
        let room = c.room;
        if (!room) {
          room = await getRoom(c.id).catch(() => "");
        }
        setRoom(c.id, room || "");
        return { ...c, room: room || "-" };
      })
    );

    return completed;
  } catch (e) {
    console.error("fetchCoursesToday error:", e);
    return [];
  }
}

function Presence() {
  const [records, setRecords] = useState([]); // semua record presensi (multi hari)
  const [courses, setCourses] = useState([]); // daftar course (unik) → SEKARANG dari tabel courses
  const [initialLoading, setInitialLoading] = useState(false);

  // ➜ totals GLOBAL dari DATABASE (tanpa filter tanggal)
  const [totalsGlobal, setTotalsGlobal] = useState({ presence: 0, absent: 0 });
  const [loadingTotals, setLoadingTotals] = useState(false);

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  if (isMobile || isTablet) return <Mobile />;

  /* ====== Fetch helper: total GLOBAL dari server ====== */
  const fetchTotalsGlobalFromServer = async () => {
    setLoadingTotals(true);

    // 1) Coba endpoint stats ringkas tanpa parameter tanggal
    const tryStats = async () => {
      try {
        const r = await fetch(`/api/presences/stats`);
        if (r.ok) {
          const data = await safeJson(r);
          if (typeof data === "object") {
            const presence =
              Number(data.totalPresence ?? data.presence ?? data.present ?? 0);
            const absent =
              Number(data.totalAbsent ?? data.absent ?? data.absence ?? 0);
            return { presence, absent, ok: true };
          }
        }
      } catch {}
      return { ok: false };
    };

    // 2) Fallback: ambil seluruh presences, hitung di client
    const tryList = async () => {
      const candidates = [
        `/api/presences?limit=100000&idWorkspace=${idWorkspace}`,
        `/api/presences?idWorkspace=${idWorkspace}`,
      ];
      for (const url of candidates) {
        try {
          const r = await fetch(url);
          if (r.ok) {
            const arr = await safeJson(r);
            if (Array.isArray(arr)) {
              let presence = 0;
              let absent = 0;
              for (const it of arr) {
                const s = normStatus(it?.status);
                if (s === "present") presence += 1;
                else if (s === "absent") absent += 1;
              }
              return { presence, absent, ok: true };
            }
          }
        } catch {}
      }
      return { ok: false };
    };

    let result = await tryStats();
    if (!result.ok) result = await tryList();

    if (result.ok) {
      setTotalsGlobal({ presence: result.presence, absent: result.absent });
    } else {
      // fallback ke hitungan lokal state
      let presence = 0;
      let absent = 0;
      for (const r of records) {
        const s = normStatus(r.status);
        if (s === "present") presence += 1;
        else if (s === "absent") absent += 1;
      }
      setTotalsGlobal({ presence, absent });
    }

    setLoadingTotals(false);
  };

  /* ===== Fetch pertama kali (data presences & courses today) ===== */
  const fetchInitial = async () => {
    setInitialLoading(true);
    try {
      // ambil presences dan courses today secara paralel
      const [presR, todayCourses] = await Promise.all([
        fetch(`/api/presences?idWorkspace=${idWorkspace}`),
        fetchCoursesToday(),
      ]);

      // ===== presences
      const presRaw = await safeJson(presR);
      const mappedRecords = (Array.isArray(presRaw) ? presRaw : []).map(mapServerRow);

      // rekonsiliasi record → isi room dari courses kalau kosong
      const reconciledRecords = mappedRecords.map((r) => {
        if (r.room && r.room !== "-") return r;
        const c = todayCourses.find((x) => x.id === r.courseId);
        return { ...r, room: c?.room || r.room || "-" };
      });

      setRecords(reconciledRecords);
      setCourses(todayCourses);
    } catch (e) {
      console.error(e);
      setRecords([]);
      setCourses([]);
    } finally {
      setInitialLoading(false);
      fetchTotalsGlobalFromServer();
    }
  };

  useEffect(() => {
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== Update status kartu & refresh totals berkala ===== */
  useEffect(() => {
    const t = setInterval(() => {
      setCourses((prev) =>
        prev.map((c) => {
          // hitung status pakai logic lama (range "HH:MM - HH:MM") tetapi TIDAK mengubah properti time yang ber-ampersand
          const dashRange =
            c.start && c.end ? `${c.start} - ${c.end}` : (c.start || c.end || "");
          return { ...c, status: statusFromNow(dashRange) };
        })
      );
      // refresh total GLOBAL dari DB supaya angka selalu up-to-date
      fetchTotalsGlobalFromServer();
    }, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== Utils Optimistic ===== */
  function upsertRecord(list, rec) {
    const id = rec.id_presence || rec.id;
    const idx = list.findIndex((x) => (x.id_presence || x.id) === id);
    if (idx === -1) return [...list, rec];
    const next = list.slice();
    next[idx] = { ...next[idx], ...rec };
    return next;
  }

  function replaceTempId(list, tempId, realId) {
    const idx = list.findIndex((x) => (x.id || x.id_presence) === tempId);
    if (idx === -1) return list;
    const next = list.slice();
    next[idx] = { ...next[idx], id: realId, id_presence: realId };
    return next;
  }

  /* ===== Handlers (Optimistic) ===== */

  // AddPresence → Optimistic create
  const onSubmitAdd = async ({ courseId, status, note /* room (ignored) */ }) => {
    const now = new Date();
    const tempId = `temp-${now.getTime()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    const courseMeta = courses.find((c) => c.id === courseId);
    const resolvedRoom = courseMeta?.room ?? peekRoom(courseId) ?? "-"; // dari course/cache

    const optimistic = {
      id: tempId,
      id_presence: tempId,
      courseId,
      courseTitle: courseMeta?.title || "-",
      room: resolvedRoom, // simpan, tapi tabel tidak menampilkan kolom room
      datetime: `${toDDMMYYYY(now)} ${toHHMMSS(now)}`,
      status, // "Present" | "Absent"
      note: note || "",
      _raw: null,
    };
    setRecords((prev) => upsertRecord(prev, optimistic));

    try {
      const res = await fetch(`/api/presences?idWorkspace=${idWorkspace}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_course: courseId,
          status, // kirim apa adanya: "Present" atau "Absent"
          note,
          id_workspace: WORKSPACE_ID,
        }),
      });

      if (res.ok) {
        try {
          const body = await safeJson(res);
          const realId = body?.id_presence || body?.id || null;
          if (realId) {
            setRecords((prev) => replaceTempId(prev, tempId, realId));
          }
          fetchTotalsGlobalFromServer();
        } catch {}
      } else {
        const t = await res.text();
        console.error("POST failed:", res.status, t);
        setRecords((prev) =>
          prev.filter((x) => (x.id || x.id_presence) !== tempId)
        );
      }
    } catch (e) {
      console.error("POST error:", e);
      setRecords((prev) =>
        prev.filter((x) => (x.id || x.id_presence) !== tempId)
      );
    }
  };

  // EditPresence → Optimistic update
  const onSaveEdit = async (updated) => {
    const key = updated.id_presence || updated.id;
    const prevSnap = records.find((x) => (x.id_presence || x.id) === key);

    const nextLocal = {
      ...prevSnap,
      status: updated.status, // "Present" | "Absent"
      note: updated.note ?? prevSnap?.note ?? "",
      room:
        (updated.room != null && String(updated.room).trim() !== ""
          ? updated.room
          : null) ??
        peekRoom(updated.courseId) ??
        prevSnap?.room ??
        "-",
    };
    setRecords((prev) => upsertRecord(prev, nextLocal));

    try {
      const res = await fetch(`/api/presences?idWorkspace=${idWorkspace}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_presence: updated.id_presence || updated.id,
          id_course: updated.courseId,
          status: updated.status, // "Present" | "Absent"
          note: updated.note,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        console.error("PUT failed:", res.status, t);
        setRecords((prev) => upsertRecord(prev, prevSnap)); // rollback
      } else {
        fetchTotalsGlobalFromServer();
      }
    } catch (e) {
      console.error("PUT error:", e);
      setRecords((prev) => upsertRecord(prev, prevSnap)); // rollback
    }
  };

  // Auto-Absent (optimistic)
  useEffect(() => {
    const checkAutoAbsent = async () => {
      const now = new Date();
      for (const c of courses) {
        const win = windowTodayFromRange(
          c.start && c.end ? `${c.start} - ${c.end}` : (c.start || c.end || "")
        );
        if (!win) continue;
        if (now <= win.end) continue;

        const already = records.some((r) => {
          if (r.courseId !== c.id) return false;
          if (!r.datetime) return false;
          const [d] = r.datetime.split(" ");
          const [dd, mm, yyyy] = d.split("/").map((x) => parseInt(x, 10));
          const dt = new Date(yyyy, (mm || 1) - 1, dd || 1);
          return (
            dt.getFullYear() === now.getFullYear() &&
            dt.getMonth() === now.getMonth() &&
            dt.getDate() === now.getDate()
          );
        });

        if (!already) {
          const tempId = `auto-${now.getTime()}-${c.id}`;
          const optimistic = {
            id: tempId,
            id_presence: tempId,
            courseId: c.id,
            courseTitle: c.title || "-",
            room: c.room || peekRoom(c.id) || "-",
            datetime: `${toDDMMYYYY(now)} ${toHHMMSS(now)}`,
            status: "Absent",
            note: "Auto-Absent (lewat end-time)",
            _raw: null,
          };
          setRecords((prev) => upsertRecord(prev, optimistic));

          try {
            const res = await fetch(`/api/presences?idWorkspace=${idWorkspace}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_course: c.id,
                status: "Absent",
                note: "Auto-Absent (lewat end-time)",
                id_workspace: WORKSPACE_ID,
              }),
            });
            if (res.ok) {
              try {
                const body = await safeJson(res);
                const realId = body?.id_presence || body?.id || null;
                if (realId) {
                  setRecords((prev) => replaceTempId(prev, tempId, realId));
                }
                fetchTotalsGlobalFromServer();
              } catch {}
            } else {
              const t = await res.text();
              console.error("Auto-Absent POST failed:", res.status, t);
              setRecords((prev) =>
                prev.filter((x) => (x.id || x.id_presence) !== tempId)
              );
            }
          } catch (e) {
            console.error("Auto-Absent POST error:", e);
            setRecords((prev) =>
              prev.filter((x) => (x.id || x.id_presence) !== tempId)
            );
          }
        }
      }
    };

    checkAutoAbsent();
    const t = setInterval(checkAutoAbsent, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, records]);

  /* ===== UI ===== */
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const onOpenAddFromCard = (course) => setSelectedCourse(course);
  const onRowClick = (row) => setEditingRecord(row);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 font-[Inter]">
        <div className="w-full pt-6">
          <header className="mb-6">
            <h1 className=" font-semibold text-foreground font-[Montserrat]  text-[20px]">
              Presence
            </h1>
            <p className="text-foreground-secondary mt-1 font-[Montserrat] text-[16px]">
              Monitor and manage attendance records with access to presence logs.
            </p>
          </header>

          {/* Cards */}
          <section className="mb-6">
            <PresenceCard
              courses={courses}
              rows={records}
              onOpenAddPresence={onOpenAddFromCard}
              totalsTodayOverride={totalsGlobal}
            />
          </section>

          {/* Table */}
          <section>
            <PresenceTable
              rows={records}
              isLoading={initialLoading}   // ⬅️ hanya loading saat fetch data awal
              onRowClick={onRowClick}
            />
          </section>
        </div>
      </main>

      {/* Add & Edit */}
      {selectedCourse && (
        <AddPresence
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onLiveUpdate={({ courseId, statusSelection, note }) =>
            setCourses((prev) =>
              prev.map((c) =>
                c.id === courseId ? { ...c, statusSelection, note } : c
              )
            )
          }
          onSubmit={onSubmitAdd}
          onAppendLog={() => {}}
          contentPaddingLeft={272}
        />
      )}

      {editingRecord && (
        <EditPresence
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={onSaveEdit}
          onAppendLog={() => {}}
          contentPaddingLeft={272}
        />
      )}
    </div>
  );
}

export default Presence;
