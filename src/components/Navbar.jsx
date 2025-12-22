import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Link, useLocation } from "react-router-dom";
import { navItemsMain, navItemsSide, navItemsSUm } from "../constants/data";
import gsap from "gsap";

export const Navbar = () => {
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [drawer, setDrawer] = useState(false);
  const drawerRef = useRef(null);
  const mounted = useRef(false);
  const location = useLocation();

  const toggleDrawer = () => setDrawer((prev) => !prev);

  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const el = drawerRef.current;
    if (!el) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

    if (drawer) {
      gsap.set(el, { visibility: "visible", pointerEvents: "auto" });
      tl.fromTo(
        el,
        { height: 0, opacity: 0, filter: "blur(16px)" },
        {
          height: 633,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.6,
        }
      );
    } else {
      tl.to(el, {
        height: 0,
        opacity: 0,
        filter: "blur(8px)",
        duration: 0.4,
        onComplete: () => {
          gsap.set(el, { visibility: "hidden", pointerEvents: "none" });
        },
      });
    }

    return () => {
      tl.kill();
    };
  }, [drawer]);

  useLayoutEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "auto";
    document.body.style.touchAction = drawer ? "none" : "auto";
    return () => {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    };
  }, [drawer]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        drawer &&
        drawerRef.current &&
        !drawerRef.current.contains(e.target)
      ) {
        setTimeout(() => setDrawer(false), 100);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [drawer]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });

      if (!res.ok) throw new Error("Failed to logout");
      localStorage.removeItem("user");

      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  return (
    <nav className="sticky top-0 bg-black py-[22px] px-6 z-[90] xl:hidden">
      {(isTablet || isMobile) && (
        <div className="flex justify-between items-center relative  w-full">
          {/* drawer */}
          <div
            ref={drawerRef}
            id="drawer"
            className={`absolute bg-gradient-to-b from-[#141414] via-[#000000] to-[#141414] md:w-[396px] w-[calc(100%+22px)] right-[-11px] md:right-[-8px] top-0 px-3 rounded-[16px] overflow-hidden border border-border/20`}
            style={{ height: 0 }}
          >
            <p className="font-semibold text-[20px] py-4 border-b border-border/50 invisible md:visible">
              Menu
            </p>
            <hr className="border-0 border-t border-border/50 md:hidden" />

            {/* navitem */}
            <div
              className={`flex flex-col pb-4 border-b border-border/50 font-inter font-semibold text-[32px] px-4 pt-12 gap-5 `}
            >
              {navItemsSUm.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 items-center ${
                    location.pathname == item.href
                      ? "text-foreground"
                      : "text-foreground/20"
                  }`}
                >
                  <div className="w-2 h-2 bg-current rounded-full" />
                  <Link
                    onClick={() => {
                      setDrawer(false);
                    }}
                    to={item.href}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex flex-col pb-4 border-b border-border/30 md:border-border/50 font-inter font-semibold text-[32px] px-4 pt-5 gap-5">
              {navItemsMain.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 items-center ${
                    location.pathname == item.href
                      ? "text-foreground"
                      : "text-foreground/20"
                  }`}
                >
                  <div className="w-2 h-2 bg-current rounded-full" />
                  <Link
                    onClick={() => {
                      setDrawer(false);
                    }}
                    to={item.href}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex flex-col font-inter font-semibold text-[32px] px-4 pt-5 pb-8 gap-5">
              {navItemsSide.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <div className="w-2 h-2 bg-current rounded-full" />
                  {item.name === "Logout" ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        setDrawer(false);
                      }}
                      className="text-left"
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link onClick={() => setDrawer(false)} to={item.href}>
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Link
            onClick={() => {
              setDrawer(false);
            }}
            to={"/"}
            className=" z-[100]"
          >
            <p className="font-genos font-bold text-[36px]">
              <span className="text-logo">GRA</span>DIA
            </p>
          </Link>
          <button type="button" className="z-[100]" onClick={toggleDrawer}>
            <i className="ri-menu-line text-[24px]"></i>
          </button>
        </div>
      )}
    </nav>
  );
};
