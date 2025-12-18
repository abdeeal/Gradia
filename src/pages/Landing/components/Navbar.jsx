import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import { navAuth, navLanding, navUser } from "@/constants/data";
import { Button } from "@/components/Button";

const Navbar = () => {
  const [drawer, setDrawer] = useState(false);
  const drawerRef = useRef(null);
  const navbarRef = useRef(null);
  const mounted = useRef(false);
  const location = useLocation();

  const toggleDrawer = () => setDrawer((prev) => !prev);

  // animasi buka/tutup drawer
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
          height: "auto",
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

  // lock scroll ketika drawer kebuka
  useLayoutEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "auto";
    document.body.style.touchAction = drawer ? "none" : "auto";

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    };
  }, [drawer]);

  // klik di luar drawer -> close
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

  // GSAP white mode on scroll
  useLayoutEffect(() => {
    const nav = navbarRef.current;
    if (!nav) return;

    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;

      // background + shadow navbar
      gsap.to(nav, {
        backgroundColor: isScrolled ? "#ffffff" : "rgba(0,0,0,0)",
        boxShadow: isScrolled
          ? "0 10px 30px rgba(0,0,0,0.08)"
          : "0 0 0 rgba(0,0,0,0)",
        duration: 0.35,
        ease: "power2.out",
      });

      // semua teks yang punya class .nav-text -> putih/ hitam
      const navTexts = nav.querySelectorAll(".nav-text");
      gsap.to(navTexts, {
        color: isScrolled ? "#000000" : "#ffffff",
        duration: 0.25,
        ease: "power2.out",
        stagger: 0.02,
      });

      // border login button ikut ganti warna
      const loginBtn = nav.querySelector(".login-btn");
      if (loginBtn) {
        gsap.to(loginBtn, {
          borderColor: isScrolled ? "#000000" : "#ffffff",
          duration: 0.25,
          ease: "power2.out",
        });
      }

      // drawer bg + border warna disesuaikan
      const drawer = drawerRef.current;
      if (drawer) {
        gsap.to(drawer, {
          backgroundColor: isScrolled ? "#ffffff" : "#141414",
          borderColor: isScrolled
            ? "rgba(0,0,0,0.16)"
            : "rgba(255,255,255,0.12)",
          duration: 0.35,
          ease: "power2.out",
        });
      }
    };

    handleScroll(); // initial state

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user != null) {
      setIsLogin(true);
    }
  }, []);

  return (
    <div
      ref={navbarRef}
      className="fixed top-0 left-0 w-full z-[90] transition-colors"
    >
      <div className="w-full xl:px-10 px-6 py-3 flex justify-between items-center font-montserrat">
        {/* logo */}
        <Link
          to="/"
          onClick={() => setDrawer(false)}
          className="z-[100] nav-text"
        >
          <p className="font-genos font-bold text-[36px]">
            <span className="text-logo">GRA</span>DIA
          </p>
        </Link>

        {/* tombol menu (mobile/tablet) */}
        <button
          type="button"
          className="z-[100] xl:hidden nav-text"
          onClick={toggleDrawer}
        >
          <i className="ri-menu-line text-[24px]" />
        </button>

        {/* drawer (mobile / tablet) */}
        <div
          ref={drawerRef}
          id="drawer"
          className="absolute md:w-[396px] w-[100%] right-0 py-3 top-0 px-3 rounded-b-[16px] overflow-hidden border shadow-md"
          style={{
            height: 0,
            visibility: "hidden",
            pointerEvents: "none",
            // initial dark mode
            backgroundColor: "#141414",
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <p className="font-semibold text-[20px] py-4 border-b border-border/50 invisible md:visible nav-text">
            Menu
          </p>
          <hr className="border-0 border-t border-border/50 md:hidden mt-6" />

          {/* navitem dari navLanding */}
          <div className="flex flex-col pb-4 font-inter border-b border-border/50 font-semibold text-[32px] px-4 pt-6 gap-5">
            {navLanding.map((item, idx) => (
              <div
                key={idx}
                className={`flex gap-4 items-center nav-text ${
                  location.pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/20"
                }`}
              >
                <div className="w-2 h-2 bg-current rounded-full" />
                <a onClick={() => setDrawer(false)} href={item.href}>
                  {item.name}
                </a>
              </div>
            ))}
          </div>
          <div className="flex flex-col pb-4 font-inter font-semibold text-[32px] px-4 pt-6 gap-5">
            {!isLogin
              ? navAuth.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-4 items-center nav-text ${
                      location.pathname === item.href
                        ? "text-foreground"
                        : "text-foreground/20"
                    }`}
                  >
                    <div className="w-2 h-2 bg-current rounded-full" />
                    <Link onClick={() => setDrawer(false)} to={item.href}>
                      {item.name}
                    </Link>
                  </div>
                ))
              : navUser.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-4 items-center nav-text ${
                      location.pathname === item.href
                        ? "text-foreground"
                        : "text-foreground/20"
                    }`}
                  >
                    <div className="w-2 h-2 bg-current rounded-full" />
                    <Link onClick={() => setDrawer(false)} to={item.href}>
                      {item.name}
                    </Link>
                  </div>
                ))}
          </div>
        </div>

        {/* desktop menu */}
        <div className="xl:flex gap-10 hidden">
          {navLanding.map((item, idx) => (
            <Link
              to={item.href}
              key={idx}
              className="text-[18px] font-semibold nav-text"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="xl:flex hidden gap-3">
          {isLogin ? (
            <Link
              to={"/workspaces"}
              className="py-2 px-8 rounded-[8px] border border-white nav-text login-btn"
            >
              Workspaces
            </Link>
          ) : (
            <>
              <Link
                to={"/auth/login"}
                className="py-2 px-8 rounded-[8px] border border-white nav-text login-btn"
              >
                Login
              </Link>
              <Link to={"/auth/register"}>
                <Button
                  icon="noIcon"
                  title="Register"
                  className={"py-2 px-6 nav-text"}
                />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
