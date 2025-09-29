import React, { useState } from "react";
import { Navbar } from "../../../components/Navbar";
import { Search } from "../../../components/Search";
import { Button } from "../../../components/Button";
import { CourseCard } from "../components/Card";
import { DayTab } from "../components/DayTab";
import { Drawer } from "../components/Drawer";

export const Tab = () => {
  const [drawer, setDrawer] = useState(false)
  const [variantDrawer, setVariantDrawer] = useState(null)

  return (
    <div className="flex flex-col gap-8">
      <Drawer drawer={drawer} setDrawer={setDrawer} />
      <Navbar />
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <p className="font-montserrat text-[20px] font-semibold">Courses</p>
          <p className="text-foreground-secondary">
            Keep track of your courses all in one place.
          </p>
        </div>
        <Search />
      </div>

      <div className="flex justify-between items-center pb-4 border-b border-border/50">
        <p className="font-montserrat text-[20px] font-semibold">Overview</p>
        <div className="flex gap-3">
          <Button variant="sort" />
          <Button />
        </div>
      </div>

      <div className="flex flex-col bg-background-secondary p-2 font-montserrat gap-2">
        {/* monday */}
        <div className="flex gap-3 h-[160px]">
          <DayTab day={"Mon"} count={2} />
          <CourseCard setDrawer={setDrawer}
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

          <CourseCard setDrawer={setDrawer}
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

          <CourseCard setDrawer={setDrawer}
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

          <CourseCard setDrawer={setDrawer}
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

          <CourseCard setDrawer={setDrawer}
            start={"06.30"}
            end={"09.30"}
            title={"Manajemen Proyek TIK"}
            alias={"Mapro"}
            lecturer={"Susilo Widoyono"}
            room={"REK - 203"}
            sks={3}
          />
        </div>
      </div>
    </div>
  );
};
