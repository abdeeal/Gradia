import { useEffect, useState } from "react";
import { Search } from "../../../components/Search";
import { Button } from "../../../components/Button";
import { CourseCard } from "../components/Card";
import { DayTab } from "../components/DayTab";
import { Drawer } from "../components/Drawer";
import { useMediaQuery } from "react-responsive";
import DayMob from "../components/DayMob";
import { useSearchParams } from "react-router-dom";

export const Tab = () => {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [drawer, setDrawer] = useState(false);
  const [emptyDrawer, setEmptyDrawer] = useState(false);

  const [searchParams] = useSearchParams();
  const [courseId, setCourseId] = useState(null);

  //database
  const [courses, setCourses] = useState([]);
  const [groupedCourses, setGroupedCourses] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayMobile = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dayTab = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  //end

  useEffect(() => {
    const id = Number(searchParams.get("c"));
    if (!id || courses.length === 0) return;

    const course = courses.find((item) => item.id_courses === id);
    setCourseId(id);
    setData(course || {});
  }, [searchParams, courses]);

  //database
  useEffect(() => {
    fetch("/api/courses")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch courses");
        }
        return res.json();
      })
      .then((data) => setCourses(data))
      .catch((error) => console.error("Error fetching courses:", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const filtered = courses.filter(
      (course) =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.lecturer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped = filtered.reduce((acc, course) => {
      const day = course.day.trim();
      if (!acc[day]) acc[day] = [];
      acc[day].push(course);
      return acc;
    }, {});

    setGroupedCourses(grouped);
  }, [courses, searchTerm]);

  //end database

  return (
    <div className="flex flex-col gap-8">
      {data && Object.keys(data).length > 0 && (
        <Drawer
          key={courseId}
          drawer={drawer}
          setDrawer={setDrawer}
          data={data}
        />
      )}
      <Drawer drawer={emptyDrawer} setDrawer={setEmptyDrawer} empty />
      <div className="flex flex-col gap-4 md:gap-0 md:items-center md:flex-row md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-montserrat text-[20px] font-semibold">Courses</p>
          <p className="text-foreground-secondary">
            Keep track of your courses all in one place.
          </p>
        </div>
        <Search
          className={"w-full md:w-fit"}
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      <div className="flex justify-between items-center pb-4 border-b border-border/50">
        <p className="font-montserrat text-[20px] font-semibold">Overview</p>
        <div className="flex gap-3">
          {/* <Button variant="sort" /> */}
          <Button
            onClick={() => {
              setEmptyDrawer(true);
            }}
          />
        </div>
      </div>

      <div className="flex flex-col bg-background-secondary p-2 font-montserrat gap-2 rounded-[12px] mb-6 md:overflow-x-hidden">
        {isMobile && (
          <div>
            {dayOrder.map((day, idx) => {
              const items = groupedCourses[day] || [];
              return (
                <div className="w-full flex flex-col gap-2 pt-2" key={day}>
                  <DayMob day={dayMobile[idx]} count={items.length} />

                  {items.map((course) => (
                    <CourseCard
                      key={course.id_courses}
                      idCourse={course.id_courses}
                      setDrawer={setDrawer}
                      start={course.start.slice(0, 5)}
                      jam:menit
                      aja
                      end={course.end.slice(0, 5)}
                      title={course.name}
                      alias={course.alias}
                      lecturer={course.lecturer}
                      room={course.room}
                      sks={course.sks}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {isTablet && (
          <div className="">
            {dayOrder.map((day, idx) => (
              <div
                key={day}
                className="flex h-[160px] mb-4 overflow-x-auto relative"
              >
                <DayTab
                  day={dayTab[idx]}
                  count={groupedCourses[day]?.length || 0}
                />
                <div className="flex gap-3">
                  {groupedCourses[day]?.map((course, idx) => (
                    <CourseCard
                      key={idx}
                      idCourse={course.id_courses}
                      setDrawer={setDrawer}
                      start={course.start}
                      end={course.end}
                      title={course.name}
                      alias={course.alias}
                      lecturer={course.lecturer}
                      room={course.room}
                      sks={course.sks}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
