import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getWorkspaceId } from "../../../components/GetWorkspace";

/* =========================================================
   Const
   - Nilai tetap untuk ukuran card, jarak, skeleton, dsb.
   ========================================================= */
const CARD_W = 269; // Lebar card presence (default)
const CARD_H = 191; // Tinggi card presence (default)
const GAP = 10; // Jarak antar card di list horizontal
const SKEL_COUNT = 4; // Jumlah skeleton card saat loading
const SKEL_MIN = 200; // Minimal durasi shimmer agar tidak “kedip” (ms)

/* =========================================================
   Helpers
   - Fungsi kecil untuk membentuk URL, parsing waktu, dan utility lain
   ========================================================= */

/**
 * buildUrl(ws)
 * Tujuan:
 * - Membuat URL endpoint "/api/courses" dengan query params default:
 *   - q=today (kalau belum ada)
 *   - idWorkspace=<ws> (kalau belum ada)
 *
 * Kenapa ada origin & typeof window:
 * - Agar aman dipakai di environment SSR/Node (window undefined),
 *   jadi fallback ke "http://localhost".
 *
 * Output:
 * - Jika di browser: full URL string (contoh: https://domain.com/api/courses?...).
 * - Jika bukan browser: hanya pathname+search (contoh: /api/courses?...).
 */
const buildUrl = (ws) => {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";

  const url = new URL("/api/courses", origin);
  const sp = new URLSearchParams(url.search);

  // Set default query "today" jika belum ada
  if (!sp.get("q")) sp.set("q", "today");

  // Set workspace id jika belum ada
  if (!sp.get("idWorkspace")) sp.set("idWorkspace", String(ws));

  url.search = sp.toString();

  // Kembalikan URL sesuai environment
  return typeof window !== "undefined"
    ? url.toString()
    : `${url.pathname}${url.search}`;
};

/**
 * splitTime(c)
 * Tujuan:
 * - Normalisasi data course bila field "start" berisi "HH:MM - HH:MM"
 *   tapi field "end" belum ada.
 *
 * Contoh kasus:
 * - start: "08:00 - 10:00", end: null
 * Maka diubah menjadi:
 * - start: "08:00", end: "10:00"
 *
 * Output:
 * - Object course yang sudah dinormalisasi (atau dikembalikan apa adanya).
 */
const splitTime = (c) => {
  if (typeof c?.start === "string" && c.start.includes("-") && !c.end) {
    const [s, e] = c.start.split("-").map((x) => x.trim());
    return { ...c, start: s, end: e || null };
  }
  return c;
};

/**
 * normStatus(s)
 * Tujuan:
 * - Normalisasi status agar konsisten saat dicek.
 * - Mengubah status jadi lowercase + trim spasi.
 *
 * Output:
 * - string lowercase (misal: "Present" -> "present")
 */
const normStatus = (s) =>
  String(s || "")
    .trim()
    .toLowerCase();

/**
 * parseHM(v)
 * Tujuan:
 * - Mengubah string "HH:MM" menjadi Date object “hari ini” dengan jam & menit tersebut.
 * - Dipakai untuk membandingkan waktu course vs waktu sekarang (now).
 *
 * Output:
 * - Date object jika valid
 * - null jika input kosong
 */
const parseHM = (v) => {
  if (!v) return null;
  const [h, m] = String(v)
    .split(":")
    .map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
};

/**
 * toHM(v)
 * Tujuan:
 * - Menormalisasi waktu input jadi format "HH:MM" dengan padding 2 digit.
 * - Misal "8:5" -> "08:05"
 *
 * Output:
 * - string "HH:MM" atau "" jika input invalid/kosong.
 */
const toHM = (v) => {
  const d = parseHM(v);
  if (!d) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

/**
 * getTimeState(s, e)
 * Tujuan:
 * - Menghasilkan status waktu course berdasarkan start(s) dan end(e):
 *   - "upcoming" : sekarang sebelum start
 *   - "ongoing"  : sekarang di antara start dan end
 *   - "done"     : sekarang sudah lewat end
 *   - "unknown"  : jika data tidak memadai/invalid
 *
 * Input:
 * - s: start time "HH:MM"
 * - e: end time "HH:MM"
 */
const getTimeState = (s, e) => {
  const now = new Date();
  const ds = parseHM(s);
  const de = parseHM(e);

  if (!ds && !de) return "unknown";
  if (ds && now < ds) return "upcoming";
  if (ds && de && now >= ds && now < de) return "ongoing";
  if (de && now >= de) return "done";
  return "unknown";
};

/**
 * getTimeLabel(s, e)
 * Tujuan:
 * - Membuat label jam untuk ditampilkan di card.
 * - Output umumnya "HH:MM - HH:MM".
 *
 * Output:
 * - Jika start & end ada: "S - E"
 * - Jika hanya salah satu ada: salah satunya
 * - Jika keduanya kosong: "—"
 */
const getTimeLabel = (s, e) => {
  const S = toHM(s);
  const E = toHM(e);
  return S && E ? `${S} - ${E}` : S || E || "—";
};

/**
 * isSameDay(a, b)
 * Tujuan:
 * - Membandingkan apakah 2 tanggal berada di hari yang sama (berdasarkan locale "id-ID").
 * - Berguna untuk filter data “hari ini” (utility umum).
 *
 * Catatan:
 * - Di file ini helper ini belum dipakai langsung, tapi disiapkan untuk kebutuhan lain.
 */
const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    new Date(a).toLocaleDateString("id-ID") ===
    new Date(b).toLocaleDateString("id-ID")
  );
};

/**
 * getPresenceDate(r)
 * Tujuan:
 * - Mengambil tanggal presence dari sebuah row record.
 * - Mengembalikan presences_at atau null.
 *
 * Catatan:
 * - Di file ini helper ini belum dipakai langsung, tapi bisa dipakai untuk filtering.
 */
const getPresenceDate = (r) => r?.presences_at ?? null;

/* =========================================================
   Small UI helpers
   - Komponen kecil untuk kebutuhan styling/UI
   ========================================================= */

/**
 * HideScroll
 * Tujuan:
 * - Menyisipkan CSS global lokal (via <style>) untuk:
 *   - menyembunyikan scrollbar pada container horizontal
 *   - mengatur grid-auto-columns sesuai CARD_W
 *   - efek shimmer skeleton
 *   - responsive tweaks untuk layar 2XL dan lebih besar
 */
const HideScroll = () => (
  <style>{`
    .hide-scrollbar{scrollbar-width:none;-ms-overflow-style:none;}
    .hide-scrollbar::-webkit-scrollbar{display:none;}
    .presence-grid{grid-auto-columns:${CARD_W}px;}

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
      z-index: 1;
    }

    @keyframes gradia-shimmer-move {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    /* 🌟 2XL: besarkan card & container pakai class */
    @media (min-width: 1536px) {
      .presence-grid {
        grid-auto-columns: 320px !important;
      }

      .presence-card,
      .presence-card-skel {
        width: 320px !important;
        height: 220px !important;
      }

      .presence-box,
      .presence-side,
      .presence-side-divider {
        height: 220px !important;
      }
    }

    /* 🌟 Layar ≥ 1960px: lebarin & tinggikan card + panel total, dan center */
    @media (min-width: 1960px) {
      .presence-grid {
        grid-auto-columns: 360px !important;
      }

      .presence-card,
      .presence-card-skel {
        width: 360px !important;
        height: 240px !important;
      }

      .presence-left,
      .presence-box {
        max-width: 100%;
      }

      .presence-box,
      .presence-side,
      .presence-side-divider {
        height: 240px !important;
      }

      .presence-side {
        width: 220px !important;
        justify-content: center !important;
      }
    }
  `}</style>
);

/**
 * Box
 * Tujuan:
 * - Wrapper container untuk area card list (kiri) dan skeleton/no-data.
 * - Jika frame=true: memberi background gradient + border (seperti panel).
 * - Jika frame=false: transparan (dipakai untuk skeleton/list agar fleksibel).
 */
const Box = ({ children, frame = false }) => {
  const style = frame
    ? {
        height: `${CARD_H}px`,
        background: "linear-gradient(180deg, #070707 0%, #141414 100%)",
        border: "1px solid rgba(70,70,70,0.5)",
      }
    : {
        height: `${CARD_H}px`,
        background: "transparent",
        border: "none",
      };

  return (
    <div
      className="presence-box rounded-lg w-full transition-all duration-300"
      style={style}
    >
      {children}
    </div>
  );
};

/**
 * BoxFull
 * Tujuan:
 * - Menampilkan Box dengan frame yang isinya teks di tengah.
 * - Dipakai untuk kondisi empty state: "No Course Today".
 */
const BoxFull = ({ text }) => (
  <Box frame>
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-white font-semibold text-[16px] 2xl:text-[18px]">
        {text}
      </p>
    </div>
  </Box>
);

BoxFull.propTypes = {
  text: PropTypes.string.isRequired,
};

/* =========================================================
   Main Component: PresenceCard
   - Menampilkan daftar course hari ini (horizontal card)
   - Menampilkan skeleton ketika loading
   - Menampilkan total present/absent (panel kanan)
   ========================================================= */
const PresenceCard = ({
  courses: coursesProp = [], // optional: jika parent sudah punya courses, bisa dipakai tanpa fetch internal
  rows = [], // data presence rows (untuk total present/absent dan status presenced pada card)
  onOpenAddPresence, // callback saat tombol "Log Presence" diklik (membuka modal AddPresence)
  totalsTodayOverride = null, // optional: override total present/absent (misal dari server/parent)
  /* 🔥 loading dari parent (optional) */
  isLoading: isLoadingProp, // optional: jika parent yang mengatur loading
}) => {
  /**
   * ws
   * - mengambil workspaceId dari helper getWorkspaceId()
   * - dipakai untuk membangun URL fetch courses yang scoped by workspace
   */
  const ws = getWorkspaceId();

  /**
   * apiUrl (memoized)
   * Tujuan:
   * - Membuat URL fetch courses yang stabil (tidak berubah kecuali ws berubah).
   * - Mencegah useEffect fetch terpanggil ulang tanpa perlu.
   */
  const apiUrl = useMemo(() => buildUrl(ws), [ws]);

  /**
   * cs
   * - state internal list courses hasil fetch
   * load
   * - state internal loading untuk skeleton
   */
  const [cs, setCs] = useState([]);
  const [load, setLoad] = useState(true);

  /**
   * useEffect(fetch courses)
   * Tujuan:
   * - Fetch data course dari apiUrl saat komponen mount / apiUrl berubah.
   * - Menjaga skeleton tampil minimal SKEL_MIN ms (supaya tidak flicker).
   * - Mencegah setState setelah unmount dengan flag "alive".
   */
  useEffect(() => {
    let alive = true; // flag: false saat cleanup untuk mencegah setState setelah unmount

    /**
     * finishLoading(startTime)
     * Tujuan:
     * - Menghitung lama fetch dari startTime
     * - Jika fetch terlalu cepat (< SKEL_MIN), tahan sebentar agar skeleton minimal tampil 200ms
     * - Lalu setLoad(false)
     */
    const finishLoading = (startTime) => {
      if (!alive) return;
      const elapsed = Date.now() - startTime;
      const extra = Math.max(0, SKEL_MIN - elapsed);

      if (extra > 0) {
        setTimeout(() => {
          if (alive) setLoad(false);
        }, extra);
      } else {
        setLoad(false);
      }
    };

    /**
     * fetchCourses()
     * Tujuan:
     * - Melakukan request fetch ke /api/courses
     * - Mengambil data JSON
     * - Normalisasi bentuk respons (bisa array langsung atau {data: []})
     * - Menyimpan ke state cs
     * - Meng-handle error dengan setCs([])
     * - Mengakhiri loading lewat finishLoading()
     */
    const fetchCourses = async () => {
      const start = Date.now();
      setLoad(true);

      try {
        const res = await fetch(apiUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        if (alive) setCs(list);
      } catch {
        if (alive) setCs([]);
      } finally {
        finishLoading(start);
      }
    };

    // Jalankan fetch saat effect berjalan
    fetchCourses();

    // Cleanup: saat unmount / apiUrl berubah
    return () => {
      alive = false;
    };
  }, [apiUrl]);

  /**
   * useProp
   * - menentukan apakah kita memakai courses dari props (dari parent) atau dari fetch internal.
   */
  const useProp = coursesProp && coursesProp.length > 0;

  /**
   * raw
   * - sumber courses mentah: dari props (jika ada) atau state internal cs.
   */
  const raw = useProp ? coursesProp : cs;

  /**
   * courses (memoized)
   * Tujuan:
   * - Menormalisasi tiap course dengan splitTime
   * - Agar start/end selalu konsisten
   */
  const courses = useMemo(() => raw.map(splitTime), [raw]);

  /**
   * isLoading
   * Tujuan:
   * - Prioritas loading dari parent jika diberikan (boolean).
   * - Jika tidak ada, pakai loading internal (load).
   */
  const isLoading = typeof isLoadingProp === "boolean" ? isLoadingProp : load;

  /**
   * totalP, totalA (memoized)
   * Tujuan:
   * - Menghitung total Present dan Absent untuk panel kanan.
   * - Jika totalsTodayOverride ada, pakai override itu.
   * - Jika tidak, hitung dari rows berdasarkan status.
   */
  const { totalP, totalA } = useMemo(() => {
    if (totalsTodayOverride) {
      return {
        totalP: Number(totalsTodayOverride.presence || 0),
        totalA: Number(totalsTodayOverride.absent || 0),
      };
    }

    let p = 0;
    let a = 0;

    rows.forEach((r) => {
      const s = normStatus(r.status);
      if (s === "presence" || s === "present") p += 1;
      else if (s === "absent") a += 1;
    });

    return { totalP: p, totalA: a };
  }, [rows, totalsTodayOverride]);

  /**
   * list (memoized)
   * Tujuan:
   * - Menggabungkan data courses dengan data presence (rows) per courseId.
   * - Membuat Map byCourse agar lookup cepat.
   * - Hasil akhirnya: setiap course memiliki field "presence" (row terkait) atau null.
   *
   * Catatan:
   * - "today" dibuat tapi tidak dipakai pada kode ini (mungkin rencana filter by date).
   */
  const list = useMemo(() => {
    const byCourse = new Map();

    const today = new Date();

    rows.forEach((r) => {
      const key = String(r.courseId); // 🔑 FIELD YANG BENAR
      if (key && !byCourse.has(key)) {
        byCourse.set(key, r);
      }
    });

    return courses.map((c) => {
      const id = String(c.id);
      return { ...c, presence: byCourse.get(id) || null };
    });
  }, [courses, rows]);

  /**
   * noToday
   * Tujuan:
   * - Menentukan kondisi empty state:
   *   - sudah tidak loading
   *   - list kosong
   */
  const noToday = !isLoading && list.length === 0;

  /**
   * Render
   * Struktur:
   * - LEFT: area card horizontal (skeleton / no course / list course)
   * - RIGHT: panel total present/absent
   */
  return (
    <div className="font-[Montserrat]">
      <HideScroll />
      <div className="grid grid-cols-[80%_20%] gap-4">
        {/* LEFT */}
        <div className="presence-left flex-1 w-full">
          {isLoading ? (
            // Kondisi loading: tampilkan skeleton shimmer
            <Box>
              <div
                className="h-full w-full hide-scrollbar overflow-x-auto overflow-y-hidden flex items-stretch"
                style={{ gap: `${GAP}px` }}
              >
                {Array.from({ length: SKEL_COUNT }).map((_, idx) => (
                  <div
                    key={idx}
                    className="presence-card-skel rounded-xl px-3.5 py-3 overflow-hidden flex flex-col shadow"
                    style={{
                      width: `${CARD_W}px`,
                      height: `${CARD_H}px`,
                      background: "#242424",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {/* Konten dummy buat layout (opacity 0) agar shimmer mengikuti struktur */}
                    <div className="opacity-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 2xl:gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          <p className="text-[16px] 2xl:text-[18px]">
                            00:00 - 00:00
                          </p>
                        </div>
                        <span className="text-[16px] 2xl:text-[18px] px-1.5 py-[2px] rounded-md">
                          STATUS
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center">
                        <h3 className="text-[16px] 2xl:text-[18px] font-semibold leading-snug line-clamp-2 break-words">
                          Dummy Course Title
                        </h3>
                        <p className="text-[16px] 2xl:text-[18px] mt-1">ROOM</p>
                      </div>

                      <button
                        className="bg-gradient-to-l from-[#28073B] to-[#34146C] px-3 py-1.5 rounded-md text-[16px] flex items-center gap-1 self-start mt-2 cursor-pointer
                                         2xl:px-3.5 2xl:py-2 2xl:text-[18px] 2xl:gap-1.5"
                      >
                        Log Presence{" "}
                        <i className="ri-logout-circle-r-line ml-1" />
                      </button>
                    </div>

                    {/* Shimmer overlay */}
                    <div className="gradia-shimmer" />
                  </div>
                ))}
              </div>
            </Box>
          ) : noToday ? (
            // Kondisi kosong: tidak ada course hari ini
            <BoxFull text="No Course Today" />
          ) : (
            // Kondisi normal: tampilkan daftar course
            <Box>
              <div className="h-full w-full hide-scrollbar overflow-x-auto overflow-y-hidden">
                <div
                  className="grid grid-flow-col presence-grid h-full"
                  style={{ gap: `${GAP}px`, minWidth: "100%" }}
                >
                  {list.map((c, i) => {
                    /**
                     * t: state waktu course (ongoing/upcoming/done/unknown)
                     * label: teks label di UI
                     * labelCls/dotCls: class untuk styling label dan indikator dot
                     */
                    const t = getTimeState(c?.start, c?.end);

                    const label =
                      t === "ongoing"
                        ? "On Going"
                        : t === "upcoming"
                        ? "Upcoming"
                        : t === "done"
                        ? "Done"
                        : "";

                    const labelCls =
                      t === "ongoing"
                        ? "bg-[#EAB308]/20 text-[#FDE047]"
                        : t === "upcoming"
                        ? "bg-zinc-800/60 text-zinc-400"
                        : t === "done"
                        ? "bg-[#22C55E]/20 text-[#4ADE80]"
                        : "hidden";

                    const dotCls =
                      t === "ongoing"
                        ? "bg-[#FDE047]"
                        : t === "upcoming"
                        ? "bg-[#F87171]"
                        : t === "done"
                        ? "bg-[#22C55E]"
                        : "bg-gray-500";

                    /**
                     * presenced
                     * Tujuan:
                     * - Menentukan apakah course ini sudah di-presence-kan hari ini
                     * - Jika sudah, tombol "Log Presence" jadi disabled dan berubah jadi "Presenced"
                     */
                    const presenced =
                      !!c.presence &&
                      ["presence", "present"].includes(
                        normStatus(c.presence.status ?? "present")
                      );

                    return (
                      <div
                        key={c.id ?? i}
                        className="presence-card bg-[#1c1c1c] border border-[#2c2c2c] rounded-xl px-3.5 py-3 flex flex-col"
                        style={{ width: `${CARD_W}px`, height: `${CARD_H}px` }}
                      >
                        {/* TOP: waktu + label status waktu */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 2xl:gap-2">
                            <div className={`w-2 h-2 rounded-full ${dotCls}`} />
                            <p className="text-[16px] 2xl:text-[18px] text-foreground-secondary">
                              {getTimeLabel(c?.start, c?.end)}
                            </p>
                          </div>
                          {label && (
                            <span
                              className={`text-[16px] 2xl:text-[18px] px-1.5 py-[2px] rounded-md ${labelCls}`}
                            >
                              {label}
                            </span>
                          )}
                        </div>

                        {/* MID: title course + room */}
                        <div className="flex-1 flex flex-col justify-center">
                          <h3 className="text-[16px] 2xl:text-[18px] font-semibold leading-snug text-foreground line-clamp-2 break-words">
                            {c?.title ?? c?.name ?? "—"}
                          </h3>
                          <p className="text-[16px] 2xl:text-[18px] text-foreground-secondary mt-1">
                            {c?.room ?? c?.presence?.room ?? "—"}
                          </p>
                        </div>

                        {/* BOTTOM: tombol log presence (disabled jika sudah presenced) */}
                        <button
                          onClick={
                            presenced ? undefined : () => onOpenAddPresence?.(c)
                          }
                          className={[
                            "bg-gradient-to-l from-[#28073B] to-[#34146C] transition-all px-3 py-1.5 rounded-md text-[16px] flex items-center gap-1 self-start mt-2 cursor-pointer",
                            "2xl:px-3.5 2xl:py-2 2xl:text-[18px] 2xl:gap-1.5",
                            presenced
                              ? "opacity-50 cursor-not-allowed pointer-events-none"
                              : "hover:opacity-90",
                          ].join(" ")}
                          aria-disabled={presenced ? "true" : "false"}
                        >
                          {presenced ? (
                            <>Presenced</>
                          ) : (
                            <>
                              Log Presence{" "}
                              <i className="ri-logout-circle-r-line ml-1" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Box>
          )}
        </div>

        {/* RIGHT: panel total present/absent */}
        <div className="ml-4 flex items-start gap-4 w-full">
          <div
            className="presence-side-divider w-px bg-[#2c2c2c]"
            style={{ height: `${CARD_H}px` }}
          />
          <div
            className="presence-side w-[160px] 2xl:w-[190px] flex flex-col items-center text-center"
            style={{ height: `${CARD_H}px` }}
          >
            <h4 className="text-[16px] 2xl:text-[18px] font-semibold text-foreground mt-1 mb-6 2xl:mb-7">
              Total Present
            </h4>

            <div className="flex flex-col items-center mb-5 2xl:mb-6">
              <div className="bg-[#22C55E]/20 text-[#4ADE80] text-[13px] 2xl:text-[14px] font-semibold px-3 py-1 rounded-md mb-1 2xl:mb-1.5">
                {totalP}
              </div>
              <span className="text-[16px] 2xl:text-[18px] text-foreground-secondary">
                Present
              </span>
            </div>

            <div className="flex flex-col items-center mt-auto">
              <div className="bg-[#EF4444]/20 text-[#F87171] text-[13px] 2xl:text-[14px] font-semibold px-3 py-1 rounded-md mb-1 2xl:mb-1.5">
                {totalA}
              </div>
              <span className="text-[16px] 2xl:text-[18px] text-foreground-secondary">
                Absent
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PresenceCard.propTypes = {
  courses: PropTypes.array,
  rows: PropTypes.array,
  onOpenAddPresence: PropTypes.func,
  totalsTodayOverride: PropTypes.shape({
    presence: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    absent: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  isLoading: PropTypes.bool,
};

export default PresenceCard;
