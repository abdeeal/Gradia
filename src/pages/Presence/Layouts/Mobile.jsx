import Badges from "@/components/Bagdes";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Card from "../components/Card";
import { Search } from "@/components/Search";
import Pagination from "../components/Pagination";
import HeaderWithSizeMenu from "../components/HeaderWithSizeMenu";
import { Skeleton } from "@/components/ui/skeleton";
import Popup from "../components/Popup";

const Mobile = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Popup state
  const [popupData, setPopupData] = useState(null);
  const [popupMode, setPopupMode] = useState(null);

  // Klik card (add presence baru)
  const handleCardClick = (course) => {
    setPopupData(course);
    setPopupMode("add");
  };

  // Klik row (edit presence)
  const handleRowClick = (presence) => {
    setPopupData(presence);
    setPopupMode("edit");
  };

  const handleClosePopup = () => {
    setPopupData(null);
    setPopupMode(null);
  };

  const idWorkspace = sessionStorage.getItem("id_workspace")

  // Courses today
  const [courses, setCourses] = useState([]);
  const [cLoading, setCLoading] = useState(true);
  useEffect(() => {
    if (!idWorkspace) return;
    fetch(`/api/courses?q=today&idWorkspace=${idWorkspace}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch courses");
        return res.json();
      })
      .then((data) => setCourses(data))
      .catch((error) => console.error("Error fetching courses:", error))
      .finally(() => setCLoading(false));
  }, [idWorkspace]);

  // Presences data
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [attendedCourseIds, setAttendedCourseIds] = useState([]);

  const fetchPresences = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const res = await fetch(`/api/presences?idWorkspace=${idWorkspace}`);
      const data = await res.json();

      const formatted = data.map((item) => {
        const dateObj = new Date(item.presences_at);
        const date = dateObj.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const time = dateObj.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return {
          id: item.id_presence,
          date,
          id_courses: item.id_course,
          course: item.course_name,
          time,
          status: item.status,
          note: item.note,
          created_at: item.created_at,
          room: item.course_room,
          sks: item.course_sks,
          start: item.course_start,
          end: item.course_end,
        };
      });

      setPresences(formatted);

      const now = new Date();
      const todayDate = now.getDate();
      const todayMonth = now.getMonth();
      const todayYear = now.getFullYear();

      const attended = formatted
        .filter((p) => {
          const d = new Date(p.created_at || p.presences_at);
          return (
            d.getDate() === todayDate &&
            d.getMonth() === todayMonth &&
            d.getFullYear() === todayYear
          );
        })
        .map((p) => p.id_courses);

      setAttendedCourseIds(attended);
    } catch (error) {
      console.error("Error fetching presences:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!idWorkspace) return;
    fetchPresences();
  }, [fetchPresences, idWorkspace]);

  // fungsi refresh tanpa skeleton
  const refreshPresences = useCallback(() => {
    fetchPresences(false);
  }, [fetchPresences]);

  // Summary counts
  const totalPresence = presences.filter((p) => p.status === "Present").length;
  const totalAbsent = presences.filter((p) => p.status === "Absent").length;

  // Search filter (by course name)
  const filtered = presences.filter((item) =>
    item.course?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const currentPageData = useMemo(
    () => filtered.slice(start, end),
    [filtered, start, end]
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Popup */}
      {popupData && (
        <Popup
          key={popupData.id || popupData.id_courses}
          data={popupData}
          mode={popupMode}
          onClose={handleClosePopup}
          onSuccess={refreshPresences} // ⬅️ ini trigger refresh tanpa skeleton
        />
      )}

      {/* Header */}
      <div className="w-full flex justify-between items-center gap-[24px]">
        <header className="flex flex-col gap-2">
          <p className="font-montserrat text-[20px] font-semibold">Presences</p>
          <p className="text-foreground-secondary">
            Monitor and manage attendance records with access to presence logs.
          </p>
        </header>
        <Search
          value={search}
          onChange={setSearch}
          placeholder="Search course"
          className={"max-md:hidden"}
        />
      </div>

      {/* Mobile Summary */}
      <div className="w-full flex flex-col py-3 items-center gap-4 rounded-[12px] border-border/50 border md:hidden">
        <span className="font-semibold text-[20px]">Total Presence</span>
        <div className="flex">
          <div className="flex flex-col px-2.5 py-2.5 gap-2.5 items-center">
            <Badges
              title={totalPresence}
              color="green"
              className="text-[20px] w-[44px] h-[44px] flex items-center justify-center"
            />
            <p>Presence</p>
          </div>
          <div className="flex flex-col px-2.5 items-center py-2.5 gap-2.5">
            <Badges
              title={totalAbsent}
              color="red"
              className="text-[20px] w-[44px] flex items-center justify-center h-[44px]"
            />
            <p>Absent</p>
          </div>
        </div>
      </div>

      {/* Courses Today */}
      <div className="w-full flex justify-between md:h-fit">
        <div className="w-full">
          {cLoading ? (
            <Skeleton className="w-full md:w-[95%] h-[184px] rounded-[12px]" />
          ) : courses.length > 0 ? (
            <div className="flex overflow-x-auto gap-4 pb-4">
              {courses.map((item, idx) => {
                const isAttended = attendedCourseIds.includes(item.id_courses);

                return (
                  <Card
                    key={idx}
                    onClick={() => {
                      if (!isAttended) handleCardClick(item);
                    }}
                    end={item.end.slice(0, 5)}
                    start={item.start.slice(0, 5)}
                    room={item.room}
                    sks={item.sks}
                    title={item.name}
                    disabled={isAttended}
                    className={`shrink-0 ${
                      courses.length > 1 ? "w-[90%]" : "w-full"
                    } md:w-[269px] ${
                      isAttended
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : ""
                    }`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="w-full md:w-[95%] h-[184px] flex justify-center items-center border border-border/50 bg-gradient-to-t from-[#141414] to-[#070707] rounded-[12px]">
              <p className="text-foreground-secondary">
                No courses are scheduled for today.
              </p>
            </div>
          )}
        </div>

        {/* Desktop Summary */}
        <div className="flex flex-col pl-8 pr-4 border-l border-border/50 justify-between max-md:hidden">
          <p className="font-semibold text-center">Total Presence</p>
          <div className="flex flex-col gap-3 items-center">
            <Badges title={totalPresence} color="green" className="w-fit" />
            <p>Presence</p>
          </div>
          <div className="flex flex-col gap-3 items-center">
            <Badges title={totalAbsent} color="red" className="w-fit" />
            <p>Absent</p>
          </div>
        </div>
      </div>

      {/* Search (Mobile) */}
      <Search
        value={search}
        onChange={setSearch}
        placeholder="Search course"
        className={"md:hidden w-full"}
      />

      <HeaderWithSizeMenu
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        setPage={setPage}
      />

      {/* Table */}
      <div className="bg-background-secondary text-foreground-secondary pb-3 px-3 rounded-lg flex flex-col max-md:items-center relative">
        <div className="w-full overflow-x-auto">
          <div className="min-w-max bg-background rounded-lg inline-block md:w-full">
            <table className="text-sm text-center border-collapse relative w-full">
              <thead className="bg-background-secondary text-foreground">
                <tr>
                  <th className="py-4 px-3">No</th>
                  <th className="py-4 px-3">Date</th>
                  <th className="py-4 px-3 w-[140px] md:w-[156px]">Courses</th>
                  <th className="py-4 px-3">Time</th>
                  <th className="py-4 px-3 sticky right-0 bg-background-secondary z-10 w-[150px]">
                    Status
                  </th>
                  <th className="py-4 px-3 w-[200px]">Note</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <div className="w-full flex justify-center">
                        <Skeleton className="w-[95%] h-[40px] rounded-[8px]" />
                      </div>
                    </td>
                  </tr>
                ) : currentPageData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="py-6 text-center text-foreground-secondary"
                    >
                      No presence data found.
                    </td>
                  </tr>
                ) : (
                  currentPageData.map((row, index) => (
                    <tr
                      key={row.id}
                      className="hover:bg-accent group cursor-pointer"
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="py-2 px-3">
                        {String(start + index + 1).padStart(2, "0")}
                      </td>
                      <td className="py-4 px-3">{row.date}</td>
                      <td className="py-4 px-3 w-[140px]">{row.course}</td>
                      <td className="py-4 px-3">{row.time}</td>
                      <td className="py-4 px-3 sticky right-0 z-10 bg-background group-hover:bg-accent">
                        <div className="w-full flex justify-center items-center h-full">
                          <Badges
                            title={row.status}
                            color={row.status === "Present" ? "green" : "red"}
                            className="text-center w-fit"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-3 text-foreground-secondary w-[200px]">
                        {row.note || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
};

export default Mobile;
