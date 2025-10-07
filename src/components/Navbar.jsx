import { useEffect, useRef, useState } from "react";
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

  const toggleDrawer = () => {
    if (drawer) {
      setDrawer(false);
    } else {
      setDrawer(true);
    }
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    if (drawer) {
      drawerRef.current.classList.add("inline");
      drawerRef.current.classList.remove("hidden");

      gsap.fromTo(
        drawerRef.current,
        { height: 0, filter: "blur(16px)" },
        {
          height: 633,
          filter: "blur(0px)",
          duration: 1,
          ease: "power2.out",
        }
      );
    } else {
      drawerRef.current.classList.remove("inline");
      setTimeout(() => {
        drawerRef.current.classList.add("hidden");
      }, 500);

      gsap.to(drawerRef.current, {
        height: 0,
        filter: "blur(8px)",
        duration: 0.4,
        ease: "power2.in",
      });
    }
  }, [drawer]);

  return (
    <nav className="sticky top-0 bg-black py-[22px]">
      {(isTablet || isMobile) &&  (
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
                  <Link to={item.href}>{item.name}</Link>
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
                  <Link to={item.href}>{item.name}</Link>
                </div>
              ))}
            </div>

            <div className="flex flex-col font-inter font-semibold text-[32px] px-4 pt-5 pb-8 gap-5">
              {navItemsSide.map((item, idx) => (
                <div key={idx} className={`flex gap-4 items-center`}>
                  <div className="w-2 h-2 bg-current rounded-full" />
                  <Link to={item.href}>{item.name}</Link>
                </div>
              ))}
            </div>
          </div>

          <Link to={"/"} className=" z-[100]">
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
