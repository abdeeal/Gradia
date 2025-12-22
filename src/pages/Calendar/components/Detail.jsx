import React, { useEffect, useRef } from "react"; // Import React + hooks: useEffect (side effect), useRef (referensi DOM)
import PropTypes from "prop-types"; // Untuk validasi tipe props di development
import { useNavigate } from "react-router-dom"; // Hook untuk navigasi ke route lain
import { gsap } from "gsap"; // Library animasi GSAP

// DOT palette (solid dari BG palet baru) // Kumpulan warna titik (dot) indikator di UI
const DOTS = {
  Blue: "#3b82f6", // medium + in progress // Biru: prioritas medium & status in progress
  Green: "#22c55e", // completed // Hijau: status selesai
  Purple: "#a855f7", // high + in progress // Ungu: prioritas tinggi & in progress
  Orange: "#f97316", // medium + overdue // Oranye: prioritas medium & overdue
  Yellow: "#eab308", // medium + not started // Kuning: prioritas medium & belum mulai
  Red: "#ef4444", // high + overdue // Merah: prioritas tinggi & overdue
  Cyan: "#06b6d4", // low + in progress // Cyan: prioritas rendah & in progress
  Pink: "#ec4899", // high + not started // Pink: prioritas tinggi & belum mulai
  Gray: "#6b7280", // low + not started / default // Abu: prioritas rendah & belum mulai / default
};

// LABEL (warna lama, tetap) // Style badge untuk status (background & text)
const STATUS_STYLES = {
  Completed: { bg: "#22C55E33", text: "#4ADE80" }, // Style badge "Completed"
  "In Progress": { bg: "#06B6D433", text: "#22D3EE" }, // Style badge "In Progress"
  "Not started": { bg: "#6B728033", text: "#D4D4D8" }, // Style badge "Not started"
  Overdue: { bg: "#EF444433", text: "#F87171" }, // Style badge "Overdue"
};

// Style badge untuk prioritas (background & text)
const PRIORITY_STYLES = {
  High: { bg: "#EF444433", text: "#F87171" }, // Style badge "High"
  Medium: { bg: "#EAB30833", text: "#FDE047" }, // Style badge "Medium"
  Low: { bg: "#6B728033", text: "#D4D4D8" }, // Style badge "Low"
};

// Canonical maps (handle variasi penulisan / bahasa) // Peta untuk menyamakan berbagai input status ke format standar
const STATUS_MAP = {
  completed: "Completed", // Kalau input "completed" -> "Completed"
  done: "Completed", // Kalau input "done" -> "Completed"
  selesai: "Completed", // Kalau input "selesai" -> "Completed"

  "in progress": "In Progress", // "in progress" -> "In Progress"
  inprogress: "In Progress", // "inprogress" -> "In Progress"
  ongoing: "In Progress", // "ongoing" -> "In Progress"
  progress: "In Progress", // "progress" -> "In Progress"

  "not started": "Not started", // "not started" -> "Not started"
  notstarted: "Not started", // "notstarted" -> "Not started"
  "belum mulai": "Not started", // "belum mulai" -> "Not started"
  todo: "Not started", // "todo" -> "Not started"

  overdue: "Overdue", // "overdue" -> "Overdue"
  late: "Overdue", // "late" -> "Overdue"
  terlambat: "Overdue", // "terlambat" -> "Overdue"
};

// Peta untuk menyamakan berbagai input priority ke format standar
const PRIORITY_MAP = {
  high: "High", // "high" -> "High"
  tinggi: "High", // "tinggi" -> "High"
  p1: "High", // "p1" -> "High"
  urgent: "High", // "urgent" -> "High"

  medium: "Medium", // "medium" -> "Medium"
  sedang: "Medium", // "sedang" -> "Medium"
  p2: "Medium", // "p2" -> "Medium"

  low: "Low", // "low" -> "Low"
  rendah: "Low", // "rendah" -> "Low"
  p3: "Low", // "p3" -> "Low"
};

// helper normalisasi // Fungsi untuk mengubah input (string) menjadi label standar berdasarkan map
const norm = (val, map) => {
  const s = (val ?? "").toString().trim().toLowerCase(); // Pastikan val jadi string, rapihin spasi, lowercase
  return map[s] ?? null; // Kalau ada di map -> kembalikan hasilnya, kalau tidak -> null
};

// Nama bulan untuk ditampilkan di header (Event for DD Month)
const MONTHS = [
  "January", // Bulan 1
  "February", // Bulan 2
  "March", // Bulan 3
  "April", // Bulan 4
  "May", // Bulan 5
  "June", // Bulan 6
  "July", // Bulan 7
  "August", // Bulan 8
  "September", // Bulan 9
  "October", // Bulan 10
  "November", // Bulan 11
  "December", // Bulan 12
];

/* 🔥 Helper: format jam START–END
   - START selalu "00:00"
   - END diambil dari deadline (timestamptz, ambil HH:mm aja)
*/ // Fungsi untuk menampilkan jam event dengan format yang diinginkan
const fmtTime = (ev) => {
  const START = "00:00"; // Jam mulai selalu 00:00

  const rawDeadline = ev?.raw?.deadline ?? ev?.deadline ?? null; // Ambil deadline dari ev.raw.deadline kalau ada, kalau tidak ev.deadline

  if (rawDeadline) { // Kalau deadline ada
    const d = new Date(rawDeadline); // Convert deadline ke object Date
    if (!Number.isNaN(d.getTime())) { // Pastikan date valid
      const hh = String(d.getHours()).padStart(2, "0"); // Ambil jam (00-23) dan pad jadi 2 digit
      const mm = String(d.getMinutes()).padStart(2, "0"); // Ambil menit (00-59) dan pad jadi 2 digit
      const END = `${hh}:${mm}`; // Bentuk jam akhir HH:mm
      return `${START} - ${END}`; // Output: "00:00 - HH:mm"
    }
  }

  // fallback lama (tidak diubah logic-nya) // Kalau deadline tidak ada/invalid, pakai format lama
  if (ev.start && ev.end) return `${ev.start} - ev.end`; // Jika ada start & end, tampilkan (catatan: ini mengikuti kode asli apa adanya)
  if (ev.start) return ev.start; // Jika hanya start, tampilkan start
  return "00:00 - 23:59"; // Default kalau tidak ada apa-apa
};

// Komponen Tag untuk badge status/prioritas
const Tag = ({ label, theme }) =>
  label && theme ? ( // Render hanya kalau label dan theme ada
    <span
      className="flex min-w-[105px] h-6 items-center justify-center rounded-lg text-[16px] font-montserrat" // Styling badge
      style={{
        backgroundColor: theme.bg, // Warna background badge
        color: theme.text, // Warna text badge
        textTransform:
          (label || "").toString().toLowerCase() === "overdue" // Kalau label overdue
            ? "capitalize" // Huruf depan kapital (Overdue)
            : "none", // Selain itu, tidak diubah
      }}
    >
      {label} {/* Teks yang ditampilkan di badge */}
    </span>
  ) : null; // Kalau tidak ada label/theme, tidak render apa-apa

Tag.propTypes = {
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]), // label boleh string atau node React
  theme: PropTypes.shape({
    bg: PropTypes.string.isRequired, // bg wajib string
    text: PropTypes.string.isRequired, // text wajib string
  }),
};

export default function EventDetailsPanel({ selectedDate, events = [] }) { // Komponen utama panel detail event
  const cardRef = useRef(null); // Referensi untuk container list card (untuk animasi)
  const navigate = useNavigate(); // Hook untuk pindah halaman

  useEffect(() => { // Efek yang jalan saat selectedDate berubah atau jumlah events berubah
    if (!cardRef.current) return; // Kalau ref belum ada, stop
    gsap.fromTo( // Animasi masuk untuk setiap child card
      cardRef.current.children, // Target: semua anak dari container
      { autoAlpha: 0, y: 6 }, // Kondisi awal: transparan & turun 6px
      { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power1.out" } // Kondisi akhir: muncul, balik posisi, durasi 0.3s, delay bertahap
    );
  }, [selectedDate, events.length]); // Dependency: tanggal terpilih dan jumlah event

  // DOT solid color — pakai status dulu, lalu priority // Fungsi menentukan warna dot berdasarkan status & priority
  const dotColor = (ev) => { // Terima satu event
    const rawStatus = ev.status ?? ev.raw?.status; // Ambil status dari ev.status, fallback ke ev.raw.status
    const rawPriority = ev.priority ?? ev.raw?.priority; // Ambil priority dari ev.priority, fallback ke ev.raw.priority

    const status = norm(rawStatus, STATUS_MAP) || rawStatus || "Not started"; // Normalisasi status, kalau gagal pakai raw, kalau kosong default "Not started"
    const priority = norm(rawPriority, PRIORITY_MAP) || rawPriority || null; // Normalisasi priority, kalau gagal pakai raw, kalau kosong null

    if (status === "Completed") return DOTS.Green; // Selesai -> hijau

    if (status === "In Progress") { // Kalau sedang dikerjakan
      if (priority === "High") return DOTS.Purple; // High + in progress -> ungu
      if (priority === "Medium" || priority === null) return DOTS.Blue; // Medium/undefined + in progress -> biru
      return DOTS.Cyan; // Low + in progress -> cyan
    }

    if (status === "Not started") { // Kalau belum mulai
      if (priority === "High") return DOTS.Pink; // High + not started -> pink
      if (priority === "Medium" || priority === null) return DOTS.Yellow; // Medium/undefined + not started -> kuning
      return DOTS.Gray; // Low + not started -> abu
    }

    if (status === "Overdue") { // Kalau lewat deadline
      if (priority === "High" || priority === null) return DOTS.Red; // High/undefined + overdue -> merah
      return DOTS.Orange; // Selain itu (medium/low) -> oranye
    }

    return DOTS.Gray; // Default kalau tidak match kondisi di atas
  };

  return (
    <aside className="flex w-full 2xl:pl-2 pr-4 flex-col self-start pt-4 font-montserrat"> {/* Container panel kanan/kiri */}
      <h2 className="mb-0 text-[16px] font-semibold"> {/* Judul panel */}
        Event for {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]} {/* Tanggal & bulan dari selectedDate */}
      </h2>
      <p className="mb-7.5 text-[16px] text-gray-400"> {/* Subtitle */}
        Don{"'"}t miss scheduled events {/* Teks info */}
      </p>

      <div className="space-y-2.5" ref={cardRef}> {/* Container list card + ref untuk animasi */}
        {events.map((ev) => { // Loop semua event
          const priorityLabel = norm(ev.priority, PRIORITY_MAP) || ev.priority; // Label prioritas yang sudah dinormalisasi
          const statusLabel = norm(ev.status, STATUS_MAP) || ev.status; // Label status yang sudah dinormalisasi

          return (
            <div
              key={ev.id} // Key untuk React list
              className="relative flex h-[166px] w-full flex-col space-y-[15px] rounded-lg border border-[rgba(101,101,101,0.5)] bg-[linear-gradient(180deg,#070707_0%,#141414_100%)] p-2.5" // Styling card
            >
              {/* Top Row */} {/* Baris atas: dot + jam + tombol */}
              <div className="flex items-center justify-between text-[16px] text-gray-400"> {/* Layout kiri-kanan */}
                <span className="flex items-center gap-2"> {/* Bagian kiri: dot + time */}
                  <span
                    className="h-3 w-3 rounded-full" // Dot kecil bulat
                    style={{
                      backgroundColor: dotColor(ev), // Warna dot sesuai status/prioritas
                    }}
                  />
                  {/* 🔥 Jam: START = 00:00, END = dari deadline (HH:mm) */} {/* Tampilkan jam hasil fmtTime */}
                  {fmtTime(ev)} {/* Output string jam */}
                </span>

                <button
                  type="button" // Tipe button
                  title="Go to tasks" // Tooltip
                  onClick={() => navigate("/tasks")} // Klik -> pindah ke halaman /tasks
                  className="inline-flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full border border-white/20 hover:bg-white/10" // Styling tombol icon
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"> {/* Icon panah */}
                    <path
                      d="M7 17L17 7M17 7H8M17 7V16" // Bentuk garis icon
                      stroke="currentColor" // Warna mengikuti text color
                      strokeWidth="2" // Ketebalan garis
                      strokeLinecap="round" // Ujung garis bulat
                      strokeLinejoin="round" // Sambungan garis bulat
                    />
                  </svg>
                </button>
              </div>

              {/* Title & Description */} {/* Bagian judul dan deskripsi event */}
              <div className="min-h-0"> {/* Container supaya text clamp rapi */}
                <h3 className="line-clamp-2 text-[16px] font-semibold leading-tight"> {/* Judul max 2 baris */}
                  {ev.title} {/* Judul event */}
                </h3>
                {ev.desc && ( // Render deskripsi hanya kalau ev.desc ada
                  <p className="mt-1 line-clamp-2 text-[16px] text-gray-400"> {/* Deskripsi max 2 baris */}
                    {ev.desc} {/* Isi deskripsi */}
                  </p>
                )}
              </div>

              {/* Badges */} {/* Bagian badge prioritas & status */}
              <div className="mt-auto flex gap-2"> {/* Dorong ke bawah (mt-auto) dan beri jarak antar badge */}
                {ev.priority && ( // Badge prioritas hanya kalau ada ev.priority
                  <Tag
                    label={priorityLabel} // Teks badge prioritas
                    theme={PRIORITY_STYLES[priorityLabel]} // Ambil style sesuai label prioritas
                  />
                )}
                {ev.status && ( // Badge status hanya kalau ada ev.status
                  <Tag
                    label={statusLabel} // Teks badge status
                    theme={
                      STATUS_STYLES[statusLabel] || STATUS_STYLES["Not started"] // Ambil style sesuai status, fallback ke "Not started"
                    }
                  />
                )}
              </div>
            </div>
          );
        })}

        {events.length === 0 && ( // Kalau tidak ada event di tanggal itu
          <p className="text-[16px] text-gray-400"> {/* Pesan kosong */}
            No events for this date. {/* Teks info tidak ada event */}
          </p>
        )}
      </div>
    </aside>
  );
}

EventDetailsPanel.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired, // selectedDate wajib Date
  events: PropTypes.arrayOf( // events adalah array berisi object event
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // id boleh string/number
      title: PropTypes.string, // title string
      desc: PropTypes.string, // desc string
      status: PropTypes.any, // status bisa apa saja (karena ada variasi input)
      priority: PropTypes.any, // priority bisa apa saja
      start: PropTypes.string, // start string
      end: PropTypes.string, // end string
      deadline: PropTypes.oneOfType([ // deadline bisa string atau Date
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]),
      raw: PropTypes.object, // raw object (data mentah)
    })
  ),
};
