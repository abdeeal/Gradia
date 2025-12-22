import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import Badges from "@/components/Bagdes";
import CourseCard from "@/pages/Dashboard/components/CourseCard";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";

const Mobile = () => {
  const [courses, setCourses] = useState([]);
  // const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    total: 0,
    addedToday: 0,
    dueToday: [],
  });

  const user = JSON.parse(localStorage.getItem("user"));

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

  const toLocalYmd = (value) => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-CA"); // "2025-12-02"
  };

  // Fetch Tasks (tanpa ubah API)
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?idWorkspace=${idWorkspace}`);
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        const tasks = Array.isArray(data) ? data : data.data || [];

        const todayYmd = toLocalYmd(new Date());

        const completed = tasks.filter((t) => t.status === "Completed").length;
        const inProgress = tasks.filter(
          (t) => t.status === "In progress"
        ).length;
        const notStarted = tasks.filter(
          (t) =>
            t.status === "Not started" ||
            t.status === "Pending" ||
            t.status === "Overdue"
        ).length;

        const total = tasks.length;

        const addedToday = tasks.filter((t) => {
          const created = toLocalYmd(t.created_at);
          return created === todayYmd;
        }).length;

        const dueToday = tasks.filter((t) => {
          const deadline = toLocalYmd(t.deadline);
          return deadline === todayYmd;
        });

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

  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("Loading...");
  const [day, setDay] = useState(true);

  // Update waktu setiap detik
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Format waktu & tanggal
      const formattedTime = now
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(":", " : ");
      const formattedDate = now.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      // Deteksi siang atau malam
      const hour = now.getHours();
      const isDay = hour >= 6 && hour < 18; // 06:00 - 17:59 siang
      setDay(isDay);

      setTime(formattedTime);
      setDate(formattedDate);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ambil lokasi kota user
  useEffect(() => {
    const getCityFromCoords = async (lat, lon) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        const cityName =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.state ||
          "Unknown location";
        setCity(cityName);
      } catch {
        setCity("Gradia");
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          getCityFromCoords(pos.coords.latitude, pos.coords.longitude);
        },
        async () => {
          try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            setCity(data.city || data.region || "Unknown");
          } catch {
            setCity("Unknown");
          }
        }
      );
    } else {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => setCity(data.city || data.region || "Unknown"))
        .catch(() => setCity("Unknown"));
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 text-foreground pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2 mt-2">
        <p className="font-montserrat text-[20px] font-semibold">
          Welcome in, <span className="capitalize">{user.username}</span>
        </p>
        <span className="text-foreground-secondary">
          Track your learning progress, courses and tasks for today
        </span>
      </div>

      {/* Banner */}
      <div
        className={`relative w-full h-[160px] min-h-[160px] bg-gradient-to-tl ${
          day ? "from-[#539db8] to-[#164a7b]" : "from-[#272727] to-[#000]"
        } rounded-2xl flex items-center justify-center font-montserrat overflow-hidden`}
      >
        <div
          className={`absolute bg-gradient-to-t from-[#DFA62B] to-[#FFE478] w-[22vw] aspect-square rounded-full right-[-9vw] top-[-9vw] md:w-[100px] md:top-[-20%] md:right-[-5%] z-5`}
        />
        <div
          className={`absolute ${
            day ? "bg-[#50d0f4]/22" : "bg-[#656565]/22"
          } w-[42vw] aspect-square rounded-full left-[-15vw] bottom-[-8vh] md:w-[218px]`}
        />
        <div
          className={`absolute ${
            day ? "bg-[#50d0f4]/67" : "bg-[#656565]/67"
          } w-[33vw] aspect-square rounded-full right-[-12vw] top-[-6vh] md:w-[218px]`}
        />
        <div
          className={`absolute ${
            day ? "bg-[#50d0f4]/39" : "bg-[#656565]/39"
          } w-[43vw] aspect-square rounded-full right-[-14vw] top-[-6.5vh] md:w-[265px]`}
        />
        <div
          className={`absolute ${
            day ? "bg-[#50d0f4]/13" : "bg-[#656565]/13"
          } w-[54vw] aspect-square rounded-full right-[-12vw] top-[-6vh] md:w-[326px]`}
        />

        <div className="flex gap-2.5 z-10 text-white">
          <span className="font-semibold text-[32px] border-r border-white pr-3">
            {time || "00:00"}
          </span>
          <div className="flex flex-col text-[3.5vw] sm:text-base">
            <p>{date}</p>
            <p>{city}</p>
          </div>
        </div>
      </div>

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
                      color={task.priority == 'High' ? "red" : task.priority == "Medium" ?  "Yellow" : "Green"}
                      className="w-fit"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center h-[100px] bg-background-secondary rounded-[12px]">
                <p className="text-foreground-secondary">No tasks due today.</p>
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
              <div className="flex justify-center items-center h-[100px] bg-background-secondary rounded-[12px]">
                <p className="text-foreground-secondary">No courses today.</p>
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
              <ResponsiveContainer width="100%" height="140">
                <PieChart>
                  <Pie
                    data={dataPie}
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={65}
                    outerRadius={110}
                    cx="50%"
                    cy="100%"
                    paddingAngle={0}
                    cornerRadius={20}
                    stroke="none"
                  >
                    {dataPie.map((_, d) => (
                      <Cell
                        key={`cell-${d}`}
                        fill={COLORS[d % COLORS.length]}
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

              <div className="w-full flex justify-between pt-16">
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
          <p className="text-[#FFEB3B]">{stats.addedToday} tasks added today</p>
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
          <Card title={"Tasks Not Started"} className={"md:w-1/2 md:h-[180px]"}>
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
