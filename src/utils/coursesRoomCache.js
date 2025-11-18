// src/utils/coursesRoomCache.js
const roomCache = new Map();            // courseId -> room
const inflight = new Map();             // courseId -> Promise<string>

const unwrap = (d) => (d?.data ?? d?.item ?? d?.items ?? d?.result ?? d);

/** Ambil room dari API dengan fallback berurutan */
async function fetchRoomFromAPI(courseId, { signal } = {}) {
  const id = encodeURIComponent(courseId);

  try {
    const r1 = await fetch(`/api/courses?id_courses=${id}`, { signal });
    if (r1.ok) {
      let data = unwrap(await r1.json());
      if (Array.isArray(data)) {
        data = data.find((c) => String(c?.id_courses ?? c?.id) === String(courseId));
      }
      if (data?.room != null) return String(data.room);
    }
  } catch {}

  try {
    const r2 = await fetch(`/api/courses/${id}`, { signal });
    if (r2.ok) {
      const data = unwrap(await r2.json());
      if (data?.room != null) return String(data.room);
    }
  } catch {}

  try {
    const r3 = await fetch(`/api/courses?id=${id}`, { signal });
    if (r3.ok) {
      let data = unwrap(await r3.json());
      if (Array.isArray(data)) {
        data = data.find((c) => String(c?.id_courses ?? c?.id) === String(courseId));
      }
      if (data?.room != null) return String(data.room);
    }
  } catch {}

  return "";
}

export function peekRoom(courseId) {
  return roomCache.get(String(courseId));
}

export function setRoom(courseId, room) {
  roomCache.set(String(courseId), room || "");
}

/** Dedupe: satu courseId cuma 1 request berjalan */
export function getRoom(courseId, opts = {}) {
  const key = String(courseId);
  if (roomCache.has(key)) return Promise.resolve(roomCache.get(key));
  if (inflight.has(key)) return inflight.get(key);

  const p = (async () => {
    const room = await fetchRoomFromAPI(courseId, opts);
    roomCache.set(key, room || "");
    inflight.delete(key);
    return room || "";
  })();

  inflight.set(key, p);
  return p;
}

/** Opsional: panaskan cache dari list courses yang sudah dimiliki parent */
export function prewarmRooms(courses = []) {
  for (const c of courses) {
    // dukung shape { id, room } atau { id_courses, room }
    const id = c?.id_courses ?? c?.id;
    if (id != null && c?.room != null) {
      roomCache.set(String(id), String(c.room));
    }
  }
}
