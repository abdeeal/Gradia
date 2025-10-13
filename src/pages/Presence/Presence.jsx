import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Sidebar from "../../components/Sidebar.jsx";
import PresenceCard from "./components/PresenceCard.jsx";
import PresencePopup from "./components/PresencePopup.jsx";
import PresenceTable from "./components/PresenceTable.jsx";

const Presence = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [records, setRecords] = useState([
    {
      id: "rec_1",
      courseId: 1,
      courseTitle: "Sosio Informatik dan Keprofesian",
      datetime: "2025-10-12 06:35",
      status: "Present",
      note: "-",
    },
  ]);

  const containerRef = useRef(null);

  const courses = [
    {
      id: 1,
      title: "Sosio Informatik dan Keprofesian",
      time: "06:30 - 08:30",
      status: "On Going",
      rek: "305",
    },
    {
      id: 2,
      title: "Kecerdasan Artifisial",
      time: "15:30 - 18:30",
      status: "Not started",
      rek: "305",
    },
  ];

  // Sekarang popup boleh dibuka untuk semua status
  const openPopup = (c) => {
    if (!c) return;
    setSelectedCourse(c);
    setShowPopup(true);
  };

  const closePopup = () => setShowPopup(false);

  useEffect(() => {
    document.body.style.overflow = showPopup ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [showPopup]);

  useEffect(() => {
    const el = document.querySelector(".drawer-panel");
    if (showPopup && el) {
      gsap.fromTo(
        el,
        { x: "100%" },
        { x: "0%", duration: 0.5, ease: "power3.out" }
      );
    }
  }, [showPopup]);

  const handleSubmitPresence = (form) => {
    const datetime = `${form.date} ${form.time}`.trim();
    const newRecord = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      courseId: selectedCourse?.id,
      courseTitle: selectedCourse?.title || "",
      datetime,
      status: form.status,
      note: form.note || "-",
    };
    setRecords((prev) => [newRecord, ...prev]);
    closePopup();
  };

  return (
    <div className="flex min-h-screen bg-[#0e0e0e] text-white font-inter">
      <Sidebar />

      <main ref={containerRef} className="flex-1 pt-[20px] pb-6 overflow-y-auto bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-center justify-between mb-[24px] px-0 pr-6">
          <div>
            <h1 className="text-2xl font-semibold">Presence</h1>
            <p className="text-gray-400 text-sm">
              Monitor and manage attendance records with access to presence logs.
            </p>
          </div>

          {/* ✅ Lebar search bar 240px */}
          <div className="w-[240px]">
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-[#1c1c1c] border border-[#2c2c2c] rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Card atas */}
        <PresenceCard courses={courses} onOpenPopup={openPopup} />

        {/* ✅ Tabel log: jarak lebih proporsional */}
        <div className="mt-10">
          <PresenceTable records={records} />
        </div>
      </main>

      {/* Drawer Presence */}
      {showPopup && (
        <>
          <button
            aria-label="Close presence drawer"
            onClick={closePopup}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <aside className="drawer-panel fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-[#141414] border-l border-[#2c2c2c] p-6 z-50 shadow-2xl">
            <PresencePopup
              course={selectedCourse}
              onClose={closePopup}
              onSubmit={handleSubmitPresence}
            />
          </aside>
        </>
      )}
    </div>
  );
};

export default Presence;
