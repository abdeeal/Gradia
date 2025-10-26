// 📄 src/pages/Presence/Presence.jsx
import React, { useState } from "react";
import Sidebar from "../../components/Sidebar.jsx";
import PresenceCard from "./components/PresenceCard.jsx";
import PresenceTable from "./components/PresenceTable.jsx";
import AddPresence from "./components/AddPresence.jsx";
import EditPresence from "./components/EditPresence.jsx";
import Mobile from "./layouts/Mobile.jsx";
import { useMediaQuery } from "react-responsive";

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function Presence() {
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "Sosio Informatik dan Keprofesian",
      time: "06:30 - 08:30",
      status: "On Going",
      rek: "305",
      room: "Lab Komputer 305",
    },
    {
      id: 2,
      title: "Kecerdasan Artifisial",
      time: "16:30 - 18:30",
      status: "Not Started",
      rek: "302",
      room: "Ruang 302",
    },
    {
      id: 3,
      title: "Implementasi Pengujian Perangkat Lunak",
      time: "08:00 - 10:00",
      status: "Not Started",
      rek: "303",
      room: "Ruang 303",
    },
  ]);

  const [records, setRecords] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);

  const onOpenAddFromCard = (course) => setSelectedCourse(course);

  const onLiveUpdateCourse = ({ courseId, statusSelection, note }) =>
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, statusSelection, note } : c))
    );

  const onSubmitAdd = (payload) => {
    setRecords((prev) => [{ id: uid(), ...payload, datetime: "" }, ...prev]);
  };

  const onRowClick = (row) => setEditingRecord(row);

  const onSaveEdit = (updated) =>
    setRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    );

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  if (isMobile || isTablet) return <Mobile />;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      {/* ==== Konten utama sejajar dengan Gradia ==== */}
      <main className="flex-1 font-[Inter]">
        {/* Hapus margin kiri — biar sejajar persis */}
        <div className="w-full pt-6">
          {/* Header Presence */}
          <header className="mb-6">
            <h1 className=" font-semibold text-foreground font-[Montserrat]  text-[20px]">
              Presence
            </h1>
            <p className="text-foreground-secondary mt-1 font-[Montserrat] text-[16px]">
              Monitor and manage attendance records with access to presence
              logs.
            </p>
          </header>

          {/* Cards */}
          <section className="mb-6">
            <PresenceCard
              courses={courses}
              onOpenAddPresence={onOpenAddFromCard}
            />
          </section>

          {/* Tabel Presence Log */}
          <section className="">
            <PresenceTable
              rows={records}
              courses={courses}
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
          onLiveUpdate={onLiveUpdateCourse}
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
