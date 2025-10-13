import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";

const Sidebar = () => {
  const location = useLocation();
  const active = location.pathname;
  const sidebarRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      sidebarRef.current,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
    );
  }, []);

  const linkClass = (path) =>
    `group flex items-center gap-3 px-[14px] py-[6px] rounded-lg transition-all duration-200 font-inter text-[15px] ${
      active === path
        ? "bg-zinc-800 text-white font-medium"
        : "text-gray-300 hover:text-purple-400"
    }`;

  const navItems = [
    { to: "/", icon: "ri-dashboard-line", label: "Dashboard" },
    { to: "/calendar", icon: "ri-calendar-schedule-line", label: "Calendar" },
    { divider: true },
    { section: "Task" },
    { to: "/tasks", icon: "ri-list-check-3", label: "My tasks" },
    { divider: true },
    { section: "University things" },
    { to: "/courses", icon: "ri-git-repository-line", label: "Courses" },
    { to: "/presences", icon: "ri-user-shared-line", label: "Presences" },
  ];

  return (
    <div className="pr-[20px] w-[285px] shrink-0">
      <aside
        ref={sidebarRef}
        className="fixed top-3 left-3 h-[calc(100vh-24px)] w-[265px]
                   bg-black border border-[#464646] rounded-2xl shadow-md overflow-hidden"
      >
        <div className="h-full w-full bg-background-secondary rounded-2xl flex flex-col">
          {/* === LOGO (agak ke kiri, sejajar garis sidebar) === */}
          <div className="pl-[25px] pr-5 pt-5 pb-[40px]">
            <h1 className="text-[40px] font-bold font-[Genos] tracking-wide leading-none">
              <span className="text-purple-500">GRA</span>
              <span className="text-foreground">DIA</span>
            </h1>
          </div>

          {/* === BODY (Navigation) === */}
          <div className="px-5 flex-1 min-h-0">
            <nav className="font-inter space-y-[12px] overflow-y-auto pr-1 h-full">
              {navItems.map((item, index) => {
                if (item.divider)
                  return (
                    <hr
                      key={`divider-${index}`}
                      className="border-t border-[#464646]/50 mx-[4px]"
                    />
                  );

                if (item.section)
                  return (
                    <p
                      key={`section-${index}`}
                      className="text-[13px] text-for pl-[4px]"
                    >
                      {item.section}
                    </p>
                  );

                return (
                  <Link key={item.to} to={item.to} className={linkClass(item.to)}>
                    <i
                      className={`${item.icon} text-[17px] ${
                        active === item.to
                          ? "text-purple-400"
                          : "text-gray-400 group-hover:text-purple-400"
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* === FOOTER === */}
          <div className="px-5 py-5 font-inter">
            <button className="flex items-center gap-3 text-gray-400 hover:text-white py-[4px] text-[15px] mb-[12px]">
              <i className="ri-arrow-left-circle-line text-[17px]" /> Back
            </button>
            <button className="flex items-center gap-3 text-white hover:text-red-500 py-[4px] text-[15px]">
              <i className="ri-door-open-line text-[17px]" /> Logout
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
