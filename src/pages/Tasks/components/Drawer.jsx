import { Button } from "@/components/Button";
import { Textarea } from "@/components/ui/textarea";
import GridDrawer from "@/pages/Courses/components/GridDrawer";
import gsap from "gsap";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DateTime } from "./DateTime";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";
import { useAlert } from "@/hooks/useAlert";
import axios from "axios";

const Drawer = ({
  drawer,
  setDrawer,
  setTask,
  task,
  empty,
  courses = [],
  refreshTasks,
}) => {
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

  //error gsap handling
  useEffect(() => {
    const handleError = (event) => {
      if (
        event.message.includes("Failed to execute 'removeChild' on 'Node'") ||
        event.message.includes(
          "The node to be removed is not a child of this node"
        )
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  //edit, add
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(empty ? "" : task?.title || "");
  const [description, setDescription] = useState(
    empty ? "" : task?.description || ""
  );
  const [deadline, setDeadline] = useState(empty ? "" : task?.deadline || "");
  const [priority, setPriority] = useState(
    empty ? "High" : task?.priority || "High"
  );

  const [status, setStatus] = useState(
    empty ? "Not started" : task?.status || "Not started"
  );

  const [score, setScore] = useState(empty ? "" : task?.score || "");

  const [link, setLink] = useState(empty ? "Not set" : task?.link || "Not set");

  const [selectedCourse, setSelectedCourse] = useState(
    task?.relatedCourse ? String(task.relatedCourse) : undefined
  );

  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const valid =
      title.trim() !== "" &&
      !!deadline &&
      priority.trim() !== "" &&
      status.trim() !== "" &&
      selectedCourse !== undefined &&
      selectedCourse !== null &&
      String(selectedCourse).trim() !== "";
    setIsFormValid(valid);
  }, [title, deadline, priority, status, selectedCourse]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const workspaceId = sessionStorage.getItem("id_workspace");

      const payload = {
        title,
        description,
        deadline,
        priority,
        status,
        score: score === "" || score === null ? null : Number(score),
        link,
        id_workspace: workspaceId,
        id_course: selectedCourse || null,
      };

      if (empty) {
        await axios.post("/api/tasks", payload);
        showAlert({
          icon: "ri-checkbox-circle-fill",
          title: "Success",
          desc: "Task added successfully.",
          variant: "success",
        });
      } else {
        await axios.put(`/api/tasks`, { ...payload, id_task: task.id_task });
        showAlert({
          icon: "ri-checkbox-circle-fill",
          title: "Updated",
          desc: "Task updated successfully.",
          variant: "success",
        });
      }

      if (typeof refreshTasks === "function") refreshTasks();
      setDrawer(false);
    } catch (err) {
      console.log(err.response?.data || err.message);
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to save task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courses.length > 0 && task?.relatedCourse) {
      const match = courses.find(
        (c) =>
          String(c.id_courses) === String(task.relatedCourse) ||
          c.name === task.relatedCourse
      );

      if (match && selectedCourse !== String(match.id_courses)) {
        setSelectedCourse(String(match.id_courses));
        setTask((prev) => ({
          ...prev,
          relatedCourse: String(match.id_courses),
        }));
      }
    }
  }, [courses, task?.relatedCourse]);

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/tasks?id=${task.id_task}`);
      showAlert({
        icon: "ri-delete-bin-2-line",
        title: "Deleted",
        desc: `Task "${task.title}" has been deleted successfully.`,
        variant: "success",
      });
      if (typeof refreshTasks === "function") refreshTasks();
      setDrawer(false);
    } catch (err) {
      console.log(err.response?.data || err.message);
      showAlert({
        icon: "ri-error-warning-fill",
        title: "Error",
        desc: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </GridDrawer>

            <GridDrawer icon={"ri-calendar-2-line"} title={"Deadline"}>
              <DateTime
                defaultValue="2025-10-31T00:00:00Z"
                value={deadline}
                onChange={setDeadline}
              />
            </GridDrawer>

            <GridDrawer icon={"ri-links-line"} title={"Course"}>
              <SelectUi
                placeholder={"Select a course"}
                value={selectedCourse || ""}
                onChange={(val) => {
                  setSelectedCourse(val);
                  setTask((prev) => ({ ...prev, relatedCourse: val }));
                }}
              >
                <SelectLabel>Course</SelectLabel>
                {courses.length > 0 ? (
                  courses.map((item) => (
                    <SelectItem
                      key={item.id_courses}
                      value={String(item.id_courses)}
                    >
                      {item.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="none">
                    No course available
                  </SelectItem>
                )}
              </SelectUi>
            </GridDrawer>

            <GridDrawer icon={"ri-fire-line"} title={"Priority"}>
              <SelectUi
                placeholder="High"
                defaultValue={empty ? "High" : priority || "High"}
                onChange={(val) => setPriority(val)}
                valueClassFn={(val) => {
                  if (val === "Medium")
                    return "!bg-drop-yellow text-yellow px-2";
                  if (val === "Low") return "!bg-drop-cyan text-cyan px-2";
                  return "!bg-drop-red text-red px-2";
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
                defaultValue={
                  empty ? "Not started" : task?.status || "Not started"
                }
                onChange={(val) => {
                  setStatus(val);
                }}
                valueClassFn={(val) => {
                  if (val === "Not started")
                    return "!bg-drop-gray text-gray px-2";
                  if (val === "In progress")
                    return "!bg-drop-cyan text-cyan px-2";
                  if (val === "Overdue") return "!bg-drop-red text-red px-2";
                  return "!bg-drop-green text-green px-2";
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
                defaultValue={`${empty ? "" : task?.score || ""}`}
                onChange={(e) => setScore(e.target.value)}
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
                onChange={(e) => setLink(e.target.value)}
                placeholder="Not set"
                className="focus:ring-0 focus:outline-none focus:border-none underline text-blue-500 max-w-full w-full"
              />
            </GridDrawer>
          </div>
        </div>

        <div className="md:px-12 py-6 pt-20 md:pt-12 px-1 w-full flex justify-end gap-4">
          {!empty && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-[#830404] w-11 rounded-lg hover:bg-[#a50505] transition-colors"
            >
              <i className="ri-delete-bin-2-line text-[20px]"></i>
            </button>
          )}

          <Button
            variant="main"
            title={
              empty
                ? loading
                  ? "Adding..."
                  : "Add task"
                : loading
                ? "Saving..."
                : "Save changes"
            }
            onClick={handleSubmit}
            disabled={!isFormValid || loading}
            className={`transition-opacity duration-200 ${
              !isFormValid || loading
                ? "opacity-50 cursor-not-allowed"
                : "opacity-100"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Drawer;
