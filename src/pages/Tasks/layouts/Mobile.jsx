import { Button } from "@/components/Button";
import React, { useState, useEffect, useCallback } from "react";
import Category from "../components/Category";
import Card from "../components/Card";
import Drawer from "../components/Drawer";

const Mobile = () => {
  const [openCategories, setOpenCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [task, setTask] = useState(null);
  const [emptyDrawer, setEmptyDrawer] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleCategory = (title) => {
    setOpenCategories((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const fetchTasks = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const refreshTasks = () => fetchTasks(true);
  const groupedTasks = {
    "Not started": tasks.filter(
      (t) => t.status?.toLowerCase() === "not started"
    ),
    "In progress": tasks.filter(
      (t) => t.status?.toLowerCase() === "in progress"
    ),
    Completed: tasks.filter((t) => t.status?.toLowerCase() === "completed"),
    Overdue: tasks.filter((t) => t.status?.toLowerCase() === "overdue"),
  };

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {task && (
        <Drawer
          key={task.id_task}
          drawer={drawer}
          setDrawer={setDrawer}
          task={task}
          courses={courses}
          setTask={setTask}
          refreshTasks={refreshTasks}
        />
      )}

      <Drawer
        drawer={emptyDrawer}
        setDrawer={setEmptyDrawer}
        empty
        courses={courses}
        setTask={setTask}
        refreshTasks={refreshTasks}
      />

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="font-montserrat text-[20px] font-semibold">Tasks</p>
          <p className="text-foreground-secondary">
            Keep track of your tasks all in one place.
          </p>
        </div>

        <div className="p-3 border border-border/50 rounded-[12px] grid grid-cols-2 md:flex md:w-full">
          <div className="flex flex-col md:flex-row gap-2 font-semibold border-r md:border-0 border-border/50 border-dashed mr-1.5 md:w-2/5">
            <div className="flex flex-col gap-2 md:w-[50%] md:border-r border-0 border-border/50 border-dashed">
              <p className="text-foreground-secondary">Total tasks</p>
              <p className="text-[40px] text-yellow">{tasks.length}</p>
            </div>
            <div className="flex flex-col gap-2 md:w-[50%] md:border-r border-0 border-border/50 border-dashed">
              <p className="text-foreground-secondary">In progress tasks</p>
              <p className="text-[40px] text-yellow">
                {groupedTasks["In progress"].length}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:hidden">
              <p className="text-foreground-secondary">Overdue tasks</p>
              <p className="text-[40px] text-yellow">
                {groupedTasks["Overdue"].length}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2 font-semibold pl-1.5 md:w-3/5 md:justify-between">
            <div className="flex flex-col gap-2 md:border-r border-0 pr-3 border-border/50 border-dashed">
              <p className="text-foreground-secondary">Not started tasks</p>
              <p className="text-[40px] text-yellow">
                {groupedTasks["Not started"].length}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:border-r border-0 border-border/50 border-dashed pr-3">
              <p className="text-foreground-secondary">Completed tasks</p>
              <p className="text-[40px] text-yellow">
                {groupedTasks["Completed"].length}
              </p>
            </div>
            <div className="md:flex flex-col gap-2 border-0 border-border/50 border-dashed hidden">
              <p className="text-foreground-secondary">Overdue tasks</p>
              <p className="text-[40px] text-yellow">
                {groupedTasks["Overdue"].length}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pb-4 border-b border-border/50">
          <p className="font-montserrat text-[20px] font-semibold">Overview</p>
          <div className="flex gap-3">
            <Button title="Add tasks" onClick={() => setEmptyDrawer(true)} />
          </div>
        </div>

        <main className="bg-background-secondary w-full p-3 rounded-[12px] flex flex-col gap-3 mb-6 md:flex-row md:overflow-x-auto">
          {Object.entries(groupedTasks).map(([status, list]) => (
            <div
              key={status}
              className="flex flex-col w-full md:basis-1/2 md:flex-shrink-0"
            >
              <Category
                title={status}
                icon={
                  status === "Not started"
                    ? "ri-file-edit-line text-[#d4d4d8]"
                    : status === "In progress"
                    ? "ri-progress-2-line text-[#22D3EE]"
                    : status === "Completed"
                    ? "ri-folder-check-line text-[#4ADE80]"
                    : "ri-alarm-warning-line text-[#F87171]"
                }
                iconBg={
                  status === "Not started"
                    ? "bg-[#6B7280]/20"
                    : status === "In progress"
                    ? "bg-[#06B6D4]/20"
                    : status === "Completed"
                    ? "bg-[#22C55E]/20"
                    : "bg-[#EF4444]/20"
                }
                isOpen={openCategories.includes(status)}
                onToggle={() => toggleCategory(status)}
              >
                {loading ? (
                  <div className="w-full h-[214px] rounded-[12px] bg-foreground/10 animate-pulse"></div>
                ) : list.length > 0 ? (
                  list.map((task) => (
                    <Card
                      key={task.id_task}
                      onClick={() => {
                        const relatedCourseId =
                          task.relatedCourse ??
                          task.course?.id_courses ??
                          task.course_id ??
                          null;
                        setTask({
                          ...task,
                          relatedCourse: relatedCourseId,
                        });
                        setDrawer(true);
                      }}
                      course={task.course.name}
                      time={new Date(task.deadline).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      date={new Date(task.deadline).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                      desc={task.description}
                      priority={task.priority}
                      status={task.status}
                      title={task.title}
                    />
                  ))
                ) : (
                  <p className="text-foreground-secondary text-sm italic">
                    No tasks available.
                  </p>
                )}
              </Category>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
};

export default Mobile;
