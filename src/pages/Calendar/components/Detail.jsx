import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function EventDetailsPanel({ selectedDate, eventsByDate }) {
  const [notes, setNotes] = useState({});
  const [draft, setDraft] = useState("");

  const key = selectedDate.toISOString().split("T")[0];
  const eventsToday = eventsByDate[key] || [];
  const noteToday = notes[key] || "";

  const cardRef = useRef(null);
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current.children,
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power1.out" }
    );
  }, [key]);

  const addNote = () => {
    if (!draft.trim()) return;
    setNotes((prev) => ({ ...prev, [key]: draft.trim() }));
    setDraft("");
  };

  const priorityColor = {
    High: "bg-red-700 text-red-200",
    Medium: "bg-yellow-700 text-yellow-200",
    Low: "bg-green-700 text-green-200",
  };
  const statusColor = {
    Completed: "bg-green-800 text-green-200",
    "In Progress": "bg-cyan-800 text-cyan-200",
    Pending: "bg-yellow-800 text-yellow-200",
    "Not started": "bg-gray-700 text-gray-300",
  };

  return (
    <aside className="w-80 flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Event for {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}</h2>
      <p className="text-gray-400 mb-4">Don't miss scheduled events</p>

      {/* Event cards (tanpa search di panel detail) */}
      <div className="space-y-3" ref={cardRef}>
        {eventsToday.map((ev) => (
          <div key={ev.id} className="bg-zinc-900 p-3 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color }} />
                {ev.start && ev.end ? `${ev.start} - ${ev.end}` : "All day"}
              </span>
            </div>
            <h3 className="font-semibold mt-2">{ev.title}</h3>
            {ev.desc && <p className="text-sm text-gray-400">{ev.desc}</p>}
            <div className="flex gap-2 mt-2 text-xs">
              {ev.priority && <span className={`px-2 py-0.5 rounded ${priorityColor[ev.priority]}`}>{ev.priority}</span>}
              {ev.status && <span className={`px-2 py-0.5 rounded ${statusColor[ev.status]}`}>{ev.status}</span>}
            </div>
          </div>
        ))}
        {eventsToday.length === 0 && (
          <p className="text-sm text-gray-400">No events for this date.</p>
        )}
      </div>

      {/* Notes */}
      <div className="mt-auto pt-6">
        <h3 className="text-md font-semibold mb-2">Notes</h3>
        <textarea
          className="w-full bg-zinc-900 p-3 rounded-lg border border-gray-700 text-sm outline-none min-h-[120px]"
          value={draft || noteToday}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Notes for ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}...`}
        />
        <button onClick={addNote} className="mt-3 bg-purple-600 px-4 py-2 rounded-lg text-sm hover:bg-purple-700">Add Note</button>
      </div>
    </aside>
  );
}