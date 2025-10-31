import { Button } from "@/components/Button";
import AutoTextarea from "@/components/Textarea";
import { Textarea } from "@/components/ui/textarea";
import GridDrawer from "@/pages/Courses/components/GridDrawer";
import gsap from "gsap";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DateTime } from "./DateTime";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";

const Drawer = ({ drawer, setDrawer, task, empty, courses = [] }) => {
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  useLayoutEffect(() => {
    const drawerEl = drawerRef.current;
    const overlayEl = overlayRef.current;
    if (!drawerEl || !overlayEl) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    if (drawer) {
      gsap.set(drawerEl, { x: "100%", filter: "blur(16px)" });
      gsap.set(overlayEl, { opacity: 0, pointerEvents: "auto" });

      tl.to(overlayEl, { opacity: 1, duration: 0.4 }).to(
        drawerEl,
        { x: 0, filter: "blur(0px)", duration: 0.6 },
        "<"
      );
    } else {
      tl.to(drawerEl, {
        x: "100%",
        filter: "blur(16px)",
        duration: 0.5,
      })
        .to(
          overlayEl,
          {
            opacity: 0,
            duration: 0.4,
            pointerEvents: "none",
          },
          "<"
        )
        .set(overlayEl, { pointerEvents: "none" });
    }

    return () => {
      if (tl && tl.kill) {
        try {
          tl.kill();
        } catch (e) {
          console.warn("GSAP cleanup skipped (node already unmounted).");
        }
      }
    };
  }, [drawer]);

  const closeDrawer = () => {
    setDrawer(false);
  };

  useEffect(() => {
    if (drawer) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [drawer]);

  // safe link
  const safeLink = task?.link ? String(task.link).trim() : null;

  const safeUrl = (str, prefix = "") => {
    try {
      if (!str) return "#";
      return new URL(str.startsWith("http") ? str : prefix + str).href;
    } catch {
      return "#";
    }
  };

  const externalLink = safeUrl(safeLink);

  return (
    <div
      id="overlay-drawer"
      ref={overlayRef}
      className="fixed min-h-dvh w-full bg-black/20 z-[150] left-0 top-0"
      style={{ opacity: 0, pointerEvents: drawer ? "auto" : "none" }}
      onClick={closeDrawer}
    >
      <div
        id="drawer-courses"
        ref={drawerRef}
        className="absolute w-full max-w-full md:w-[624px] h-full bg-background right-0 md:border-2 border-border/50 md:rounded-l-[24px] p-4 md:p-6 flex flex-col justify-between overflow-y-auto"
        style={{ transform: "translateX(100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <button onClick={closeDrawer}>
            <i className="ri-arrow-right-double-line text-[32px] text-foreground-secondary"></i>
          </button>
          <div className="md:pt-16 pt-12 px-1 md:px-12 pb-12 flex flex-col">
            <Textarea
              placeholder="Enter your task title here"
              size="lg"
              defaultValue={`${empty ? "" : task?.title || "Not set"}`}
            />
          </div>

          <div className="grid px-1 md:px-12 grid-cols-[40%_60%] auto-rows-min max-w-full gap-2 space-y-4 md:gap-6 text-[16px] items-start w-full">
            <GridDrawer
              className={"w-full"}
              icon={"ri-file-line"}
              title={"Description"}
            >
              <Textarea
                placeholder="Not set"
                defaultValue={`${empty ? "" : task?.description || "Not set"}`}
                className={"min-h-fit"}
              />
            </GridDrawer>

            <GridDrawer icon={"ri-calendar-2-line"} title={"Deadline"}>
              <DateTime defaultValue={`${empty ? "" : task?.deadline || ""}`} />
            </GridDrawer>

            <GridDrawer icon={"ri-links-line"} title={"Course"}>
              <SelectUi
                className={""}
                placeholder={"Select a course"}
                defaultValue={
                  !empty &&
                  task?.relatedCourse &&
                  task.relatedCourse.trim() !== ""
                    ? task.relatedCourse
                    : undefined
                }
              >
                <SelectLabel>Course</SelectLabel>
                {courses
                  .filter((c) => c.name && c.name.trim() !== "")
                  .map((item, idx) => (
                    <SelectItem key={idx} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
              </SelectUi>
            </GridDrawer>

            <GridDrawer icon={"ri-fire-line"} title={"Priority"}>
              <SelectUi
                placeholder="High"
                defaultValue={empty ? "High" : task?.priority || undefined}
                valueClassFn={(val) => {
                  if (val === "Medium")
                    return "bg-drop-yellow text-yellow px-2";
                  if (val === "Low") return "bg-drop-cyan text-cyan px-2";
                  return "bg-drop-red text-red px-2";
                }}
              >
                <SelectLabel>Priority</SelectLabel>
                {["High", "Medium", "Low"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectUi>
            </GridDrawer>

            <GridDrawer icon={"ri-loader-line"} title={"Status"}>
              <SelectUi
                placeholder="Not started"
                defaultValue={empty ? "Not started" : task?.status || undefined}
                valueClassFn={(val) => {
                  if (val === "Not started")
                    return "bg-drop-gray text-gray px-2";
                  if (val === "In progress")
                    return "bg-drop-cyan text-cyan px-2";
                  if (val === "Overdue") return "bg-drop-red text-red px-2";
                  return "bg-drop-green text-green px-2";
                }}
              >
                <SelectLabel>Status</SelectLabel>
                {["Not started", "In progress", "Completed", "Overdue"].map(
                  (item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  )
                )}
              </SelectUi>
            </GridDrawer>

            <GridDrawer icon={"ri-trophy-line"} title={"Score"}>
              <input
                type="number"
                name="score"
                defaultValue={`${empty ? "" : task?.score || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none  max-w-full w-full h-full"
                placeholder="Not set"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-link"} title={"Link"} className={"w-full"}>
              {safeLink ? (
                <a
                  href={externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-0 bg-black p-1 pl-4 rounded-[4px] -translate-y-[50%] top-[50%] shadow-md"
                >
                  <i className="ri-share-forward-line" />
                </a>
              ) : null}
              <input
                type="text"
                name="link"
                defaultValue={`${empty ? "" : task?.link || ""}`}
                placeholder="Not set"
                className="focus:ring-0 focus:outline-none focus:border-none underline text-blue-500 max-w-full w-full"
              />
            </GridDrawer>
          </div>
        </div>

        <div className="md:px-12 py-6 pt-20 md:pt-12 px-1  w-full flex justify-end gap-4 cursor-none">
          {empty ? (
            ""
          ) : (
            <button className="bg-[#830404] w-11 rounded-lg">
              <i className="ri-delete-bin-2-line text-[20px]"></i>
            </button>
          )}
          {empty ? (
            <Button variant="main" title="Add course" />
          ) : (
            <Button variant="main" icon="ri-edit-line" title="Save changes" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Drawer;
