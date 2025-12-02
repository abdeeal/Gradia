import React, { useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  // Menganggap "/" dan "/dashboard" itu sama-sama Dashboard
  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const linkClass = (path) =>
    `group flex items-center gap-3 px-[14px] py-[8px] rounded-lg transition-all duration-200 font-inter text-[15px] ${
      isActive(path)
        ? "bg-zinc-800 text-white font-medium shadow-inner"
        : "text-gray-300 hover:text-purple-400 hover:bg-zinc-800/40"
    }`;

  const navItems = [
    { to: "/dashboard", icon: "ri-dashboard-line", label: "Dashboard" },
    { to: "/calendar", icon: "ri-calendar-schedule-line", label: "Calendar" },
    { divider: true },
    { section: "Task" },
    { to: "/tasks", icon: "ri-list-check-3", label: "My Tasks" },
    { divider: true },
    { section: "University Things" },
    { to: "/courses", icon: "ri-git-repository-line", label: "Courses" },
    { to: "/presences", icon: "ri-user-shared-line", label: "Presences" },
  ];

  // ====== HANDLE LOGOUT (panggil API tanpa ubah backend) ======
  const handleLogout = async () => {
    try {
      // Panggil API auth dengan action: "logout"
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "logout" }),
      });

      // Kalau API error, tetap lanjut bersihin sesi di FE
      if (!res.ok) {
        console.error("Logout API failed", await res.text());
      }

      // Bersihkan storage lokal (kalau kamu pakai id_workspace, id_user, dll)
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (e) {
        console.warn("Failed to clear storage", e);
      }

      // Arahkan balik ke halaman login
      navigate("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
      // Kalau fetch-nya aja error, tetap lempar user ke login biar aman
      navigate("/login");
    }
  };

  return (
    <div className="pr-[20px] w-[285px] shrink-0">
      <aside
        ref={sidebarRef}
        className="fixed top-3 left-3 h-[calc(100vh-24px)] w-[265px]
                   bg-black border border-[#464646] rounded-2xl shadow-md overflow-hidden"
      >
        <div className="h-full w-full bg-background-secondary rounded-2xl flex flex-col">
          {/* === LOGO === */}
          <div className="pl-[25px] pr-5 pt-5 pb-[40px]">
            <h1 className="text-[40px] font-bold font-[Genos] tracking-wide leading-none">
              <span className="text-purple-500">GRA</span>
              <span className="text-foreground">DIA</span>
            </h1>
          </div>

          {/* === NAVIGATION === */}
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
                      className="text-[13px] text-gray-400 pl-[4px]"
                    >
                      {item.section}
                    </p>
                  );

                return (
                  <Link key={item.to} to={item.to} className={linkClass(item.to)}>
                    <i
                      className={`${item.icon} text-[17px] ${
                        isActive(item.to)
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
            <Link
              to="/workspaces"
              className="flex items-center gap-3 text-gray-400 hover:text-white py-[4px] text-[15px] mb-[12px]"
            >
              <i className="ri-arrow-left-circle-line text-[17px]" /> Back
            </Link>

            {/* Logout pakai tombol supaya bisa panggil API */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 text-white hover:text-red-500 py-[4px] text-[15px]"
            >
              <i className="ri-door-open-line text-[17px]" /> Logout
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
