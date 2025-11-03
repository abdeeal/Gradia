import React from "react";

export default function DueToday({
  items = [
    { title: "Penilaian Harian 4", subject: "Jarkom", priority: "Low" },
    { title: "Penilaian Harian 4", subject: "DKA", priority: "Medium" },
  ],
  defaultOpen = true,
  taskUrl = "/tasks",
}) {
  const [open] = React.useState(defaultOpen);

  // malam: 18:01–05:59 (auto-update tiap menit)
  const checkIsNight = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    return h > 18 || (h === 18 && m >= 1) || h < 6;
  };
  const [isNight, setIsNight] = React.useState(checkIsNight());
  React.useEffect(() => {
    const id = setInterval(() => setIsNight(checkIsNight()), 60_000);
    return () => clearInterval(id);
  }, []);

 // warna label (day/night mode)
const prColor = (p = "Low") => {
  // malam = full solid, siang = transparan /20
  const bgMapDay = {
    High: "bg-[#ef4444]/20",   // merah 20%
    Medium: "bg-[#eab308]/20", // kuning 20%
    Low: "bg-[#6B7280]/20",    // abu 20%
  };
  const bgMapNight = {
    High: "bg-[#ef4444]", 
    Medium: "bg-[#eab308]",
    Low: "bg-[#6B7280]",
  };

  // teks siang
  const textDayMap = {
    High: "text-[#F87171]",   // merah terang
    Medium: "text-[#FDE047]", // kuning terang
    Low: "text-[#D4D4D8]",    // abu terang
  };

  // teks malam
  const textNight = "text-black";

  return `${isNight ? bgMapNight[p] : bgMapDay[p]} ${
    isNight ? textNight : textDayMap[p]
  } font-semibold`;
};


  // Samakan frame luar dengan CoursesToday
  const FRAME_W = 259;
  const FRAME_H = 246;
  const PAD_X = 16;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 16;
  const HEADER_GAP = 18;
  const headerHeight = 32;
  const listMaxH = FRAME_H - PAD_TOP - PAD_BOTTOM - HEADER_GAP - headerHeight;

  return (
    <div
      id="id_due"
      className="rounded-2xl border border-[#464646]/50"
      style={{
        width: FRAME_W,
        height: FRAME_H,
        // ⬇️ gradasi atas → bawah #070707 ke #141414
        backgroundImage: "linear-gradient(180deg, #070707 0%, #141414 100%)",
        paddingLeft: PAD_X,
        paddingRight: PAD_X,
        paddingTop: PAD_TOP,
        paddingBottom: PAD_BOTTOM,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        #id_due .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
        #id_due .scrollbar-hide::-webkit-scrollbar { display:none; width:0; height:0; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: HEADER_GAP }}>
        <h2
          className="font-semibold text-white"
          style={{ fontFamily: "Montserrat, sans-serif", fontSize: 20, lineHeight: "20px" }}
        >
          Due Today
        </h2>

        {/* Link bergaya tombol lingkaran (32x32, ikon 24x24) */}
        <a
          href={taskUrl}
          aria-label="Buka halaman task"
          title="Buka halaman task"
          className="rounded-full flex items-center justify-center border border-white/80 hover:bg-white/10"
          style={{ width: 32, height: 32 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
          </svg>
        </a>
      </div>

      {/* Body */}
      <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: open ? listMaxH : 0 }}>
        <div className="scrollbar-hide pr-2" style={{ maxHeight: listMaxH, overflowY: "auto" }}>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {items.map((it, idx) => (
              <div
                key={idx}
                className="rounded-xl"
                style={{
                  width: FRAME_W - PAD_X * 2,
                  height: 91,
                  background: "#262626",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 12,
                }}
              >
                {/* Icon kiri (28x28) */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    marginLeft: 12,
                    marginRight: 10,
                    marginTop: 26,
                    marginBottom: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className="ri-article-line" style={{ fontSize: 28, color: "#A78BFA", lineHeight: "28px" }} />
                </div>

                {/* Texts */}
                <div className="flex-1" style={{ fontFamily: "Inter, sans-serif" }}>
                  <h3 className="font-semibold text-white" style={{ fontSize: 16, lineHeight: "20px", marginTop: 4 }}>
                    {it.title}
                  </h3>

                  <p className="text-gray-300" style={{ fontSize: 16, lineHeight: "18px", marginTop: 4 }}>
                    {it.subject}
                  </p>

                  {it.priority && (
                    <span
                      className={`inline-flex ${prColor(it.priority)}`}
                      style={{
                        height: 17,
                        lineHeight: "20px",
                        fontSize: 14,
                        borderRadius: 4,
                        padding: "0 8px",
                        marginTop: 6,
                        alignItems: "center",
                      }}
                    >
                      {it.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
