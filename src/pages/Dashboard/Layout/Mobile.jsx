import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Badges from "@/components/Bagdes";
import CourseCard from "@/pages/Dashboard/components/CourseCard";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";

const Mobile = () => {
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    total: 0,
    addedToday: 0,
    dueToday: [],
  });

  const idWorkspace = sessionStorage.getItem("id_workspace");

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(
          `/api/courses?q=today&idWorkspace=${idWorkspace}`
        );
        if (!res.ok) throw new Error("Failed to fetch courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    if (idWorkspace) fetchCourses();
  }, [idWorkspace]);

  // Fetch Tasks (tanpa ubah API)
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?idWorkspace=${idWorkspace}`);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();

        // Hitung statistik berdasarkan data
        const today = new Date().toISOString().split("T")[0];
        const completed = data.filter((t) => t.status === "Completed").length;
        const inProgress = data.filter((t) => t.status === "In progress").length;
        const notStarted = data.filter((t) => t.status === "Not started").length;
        const total = data.length;
        const addedToday = data.filter((t) =>
          t.created_at?.startsWith(today)
        ).length;
        const dueToday = data.filter((t) =>
          t.deadline?.startsWith(today)
        );

        setTasks(data);
        setStats({
          completed,
          inProgress,
          notStarted,
          total,
          addedToday,
          dueToday,
        });
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    if (idWorkspace) fetchTasks();
  }, [idWorkspace]);

  const COLORS = ["#673AB7", "#341D5C", "#D9CEED"];
  const dataPie = [
    { name: "Completed", value: stats.completed },
    { name: "In Progress", value: stats.inProgress },
    { name: "Not Started", value: stats.notStarted },
  ];
  const bg = [
    { title: "Completed", color: "bg-[#673aB7]" },
    { title: "In Progress", color: "bg-[#341D5C]" },
    { title: "Pending", color: "bg-[#D9CEED]" },
  ];

  return (
    <div className="flex flex-col gap-6 text-foreground pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2 mt-2">
        <p className="font-montserrat text-[20px] font-semibold">
          Welcome in, Abdee Alamsyah
        </p>
        <span className="text-foreground-secondary">
          Track your learning progress, courses and tasks for today
        </span>
      </div>

      {/* Banner */}

      <div className="flex flex-col gap-6 md:flex-row md:gap-4">
        {/* DUE TODAY */}
        <Card
          title={"Due Today"}
          className="overflow-y-auto h-fit md:w-1/3 md:h-[276px]"
        >
          <div className="flex flex-col gap-3 max-h-[167px] h-fit overflow-y-auto">
            {stats.dueToday.length > 0 ? (
              stats.dueToday.map((task) => (
                <div
                  key={task.id}
                  className="flex gap-3 rounded-[12px] p-3 bg-background-secondary items-center"
                >
                  <i className="ri-article-line text-logo text-[28px]"></i>
                  <div className="flex flex-col">
                    <p className="font-semibold">{task.title}</p>
                    <p className="text-foreground-secondary mb-2">
                      {task.relatedCourse || "No course"}
                    </p>
                    <Badges
                      title={task.priority || "Normal"}
                      color="green"
                      className="w-fit"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-[100px]">
                <p className="text-foreground-secondary">
                  No tasks due today.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* COURSES TODAY */}
        <Card
          title={"Courses Today"}
          className="overflow-y-auto md:w-2/3 md:h-[276px]"
        >
          <div className="flex flex-col gap-3 max-h-[240px] h-fit overflow-y-auto md:flex-row md:overflow-x-auto md:overflow-y-hidden md:w-full md:gap-4 md:pb-2">
            {courses.length > 0 ? (
              courses.map((course, idx) => (
                <CourseCard
                  key={idx}
                  start={course.start}
                  end={course.end}
                  title={course.name}
                  alias={course.alias}
                  room={course.room}
                  lecturer={course.lecturer}
                  sks={course.sks}
                  idCourse={course.idCourse}
                  setDrawer={() => {}}
                />
              ))
            ) : (
              <div className="w-full h-full flex justify-center items-center">
                <p className="text-foreground-secondary text-center">
                  No courses today.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* TASK PROGRESS */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-4">
        <div
          id="piecard"
          className="flex flex-col md:flex-row bg-gradient-to-l from-[#211832] to-[#000] rounded-2xl relative p-6 md:w-[50%]"
        >
          <div className="w-full flex flex-col justify-center text-white">
            <p className="text-lg font-semibold mb-4">Task Progress</p>
            <div className="relative w-full h-[250px] flex justify-center items-center flex-col">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    startAngle={190}
                    endAngle={-10}
                    paddingAngle={-25}
                    dataKey="value"
                    cornerRadius={500}
                    stroke="none"
                  >
                    {dataPie.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute text-center pt-8 ">
                <p className="text-[32px] font-semibold font-montserrat">
                  {stats.total > 0
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0}
                  %
                </p>
                <p className="text-logo">Task completed</p>
              </div>

              <div className="w-full flex justify-between">
                {bg.map((item, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <div className={`w-4 h-4 rounded-full ${item.color}`} />
                    <span className="text-[14px]">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TOTAL TASKS */}
        <div className="md:w-[50%] rounded-2xl p-5 md:h-[342px] bg-gradient-to-tl from-[#28073B] to-[#34146c] flex flex-col justify-between">
          <div className="w-full flex justify-between items-center">
            <p className="font-semibold font-montserrat text-[20px]">
              Total Tasks
            </p>
            <Link
              to={"/tasks"}
              className="w-[32px] h-[32px] rounded-full bg-white flex justify-center items-center"
            >
              <i className="ri-arrow-right-up-long-line text-[24px] text-black"></i>
            </Link>
          </div>
          <p className="md:text-[80px] text-[64px] font-semibold font-montserrat">
            {stats.total}
          </p>
          <p className="text-[#FFEB3B]">
            {stats.addedToday} tasks added today
          </p>
        </div>
      </div>

      {/* TASK COUNTERS */}
      <div className="flex flex-col md:flex-row md:gap-4 gap-6 w-full">
        <div className="flex gap-4 md:gap-6 md:w-2/3">
          <Card title={"Tasks Completed"} className={"md:w-1/2 md:h-[180px]"}>
            <p className="font-montserrat text-[#FFEB3B] font-semibold text-[64px]">
              {stats.completed}
            </p>
          </Card>
          <Card
            title={"Tasks Not Started"}
            className={"md:w-1/2 md:h-[180px]"}
          >
            <p className="font-montserrat text-[#FFEB3B] font-semibold text-[64px]">
              {stats.notStarted}
            </p>
          </Card>
        </div>
        <Card title={"Tasks On Progress"} className={"md:w-1/3 h-[180px]"}>
          <p className="font-montserrat text-[#FFEB3B] font-semibold text-[64px]">
            {stats.inProgress}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Mobile;
