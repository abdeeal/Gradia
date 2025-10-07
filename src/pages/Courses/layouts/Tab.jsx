import React, { useEffect, useState } from "react";
import { Navbar } from "../../../components/Navbar";
import { Search } from "../../../components/Search";
import { Button } from "../../../components/Button";
import { CourseCard } from "../components/Card";
import { DayTab } from "../components/DayTab";
import { Drawer } from "../components/Drawer";
import { useMediaQuery } from "react-responsive";
import DayMob from "../components/DayMob";

export const Tab = () => {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [drawer, setDrawer] = useState(false);
  const [emptyDrawer, setEmptyDrawer] = useState(false);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col gap-8">
      <Drawer drawer={drawer} setDrawer={setDrawer} />
      <Drawer drawer={emptyDrawer} setDrawer={setEmptyDrawer} empty />
      <div className="flex flex-col gap-4 md:gap-0 md:items-center md:flex-row md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-montserrat text-[20px] font-semibold">Courses</p>
          <p className="text-foreground-secondary">
            Keep track of your courses all in one place.
          </p>
        </div>
        <Search className={"w-full md:w-fit"} />
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

      <div className="flex flex-col bg-background-secondary p-2 font-montserrat gap-2 rounded-[12px] mb-6">
        {isMobile && (
          <>
            <DayMob day={"Monday"} count={2} />
            <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            <DayMob day={"Tuesday"} count={2} />
            <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            <DayMob day={"Wednesday"} count={2} />
            <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            <DayMob day={"Thursday"} count={2} />
            <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            <DayMob day={"Friday"} count={2} />
            <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
          </>
        )}
        {isTablet && (
          <>
            {/* monday */}
            <div className="flex gap-3 h-[160px]">
              <DayTab day={"Mon"} count={2} />
              <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            </div>

            {/* Tuesday */}
            <div className="flex gap-3 h-[160px]">
              <DayTab day={"Tue"} count={1} />

              <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            </div>

            {/* Wed */}
            <div className="flex gap-3 h-[160px]">
              <DayTab day={"Wed"} count={1} />

              <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            </div>

            {/* Thu */}
            <div className="flex gap-3 h-[160px]">
              <DayTab day={"Thu"} count={1} />

              <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            </div>

            {/* Fri */}
            <div className="flex gap-3 h-[160px]">
              <DayTab day={"Fri"} count={1} />

              <CourseCard
                setDrawer={setDrawer}
                start={"06.30"}
                end={"09.30"}
                title={"Manajemen Proyek TIK"}
                alias={"Mapro"}
                lecturer={"Susilo Widoyono"}
                room={"REK - 203"}
                sks={3}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
