import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";

export const Drawer = ({ drawer, setDrawer }) => {
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  const closeDrawer = () => {
    setDrawer(false);
  };

  useLayoutEffect(() => {
    if (drawer) {
      gsap.fromTo(drawerRef.current, {
        filter: "blur(16px)",
      }, {
        x: 0,
        duration: 1,
        filter: "blur(0px)",
        ease: "power3.out",
      });
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
      });
    } else {
      gsap.to(drawerRef.current, {
        x: "100%",
        duration: 0.5,
        filter: "blur(16px)",
        ease: "power3.in",
      });
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power3.in",
      });
    }
  }, [drawer]);

  return (
    <div
      ref={overlayRef}
      className="fixed h-dvh w-full bg-black/20 z-[150] left-0 top-0"
      style={{ opacity: 0, pointerEvents: drawer ? "auto" : "none" }}
      onClick={closeDrawer}
    >
      <div
        ref={drawerRef}
        className="absolute w-[624px] h-full bg-black right-0 border-2 border-border rounded-l-[24px] p-6"
        style={{ transform: "translateX(100%)" }}
        onClick={(e) => e.stopPropagation()} 
      >
        <button onClick={closeDrawer}>
          <i className="ri-arrow-right-double-line text-[32px] text-foreground-secondary"></i>
        </button>

        <div className="pt-16 px-12 pb-12 flex flex-col">
          <textarea
            type="text"
            defaultValue={"Manajemen Projek TIK"}
            className="font-bold text-[48px]"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};
