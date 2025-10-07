import { useRef, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import GridDrawer from "./GridDrawer";
import { Button } from "../../../components/Button";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router-dom";

export const Drawer = ({ drawer, setDrawer, empty, data }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  const closeDrawer = () => {
    setDrawer(false);
  };

  useEffect(() => {
  const handleError = (event) => {
    if (
      event.message.includes("Failed to execute 'removeChild' on 'Node'") ||
      event.message.includes("The node to be removed is not a child of this node")
    ) {
      event.preventDefault(); 
    }
  };

  window.addEventListener("error", handleError);
  return () => window.removeEventListener("error", handleError);
}, []);


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

  return (
    <div
      id="overlay-drawer"
      ref={overlayRef}
      className="fixed h-dvh w-full bg-black/20 z-[150] left-0 top-0"
      style={{ opacity: 0, pointerEvents: drawer ? "auto" : "none" }}
      onClick={closeDrawer}
    >
      <div
        id="drawer-courses"
        ref={drawerRef}
        className="absolute w-full max-w-full md:w-[624px] h-full bg-black right-0 md:border-2 border-border/50 md:rounded-l-[24px] p-4 md:p-6 flex flex-col justify-between overflow-y-auto"
        style={{ transform: "translateX(100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <button onClick={closeDrawer}>
            <i className="ri-arrow-right-double-line text-[32px] text-foreground-secondary"></i>
          </button>
          <div className="md:pt-16 pt-12 px-1 md:px-12 pb-12 flex flex-col">
            <textarea
              type="text"
              name="name"
              defaultValue={`${
                empty ? "Course title" : data?.name || "Not set"
              }`}
              className="font-bold text-[48px] focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
              rows={2}
            />
          </div>

          <div className="grid px-1 md:px-12 grid-cols-2 grid-rows-9 w-full gap-6 text-[16px]">
            <GridDrawer icon={"ri-hashtag"} title={"Alias"}>
              <input
                type="text"
                name="alias"
                defaultValue={`${empty ? "Not set" : data?.alias || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none  max-w-full w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-graduation-cap-line"} title={"Lecturer"}>
              <input
                type="text"
                name="lecturer"
                defaultValue={`${empty ? "Not set" : data?.lecturer || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-phone-line"} title={"Phone"}>
              <Link to={`https://wa.me/${data?.phone}` || "#"} className="absolute right-0 p-1 pl-4 rounded-[4px] -translate-y-[50%] top-[50%]">
                <i className="ri-whatsapp-line " />
              </Link>
              <input
                type="number"
                name="phone"
                defaultValue={`${empty ? "Not set" : data?.phone || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-calendar-event-line"} title={"Day"}>
              <input
                type="text"
                name="day"
                defaultValue={`${empty ? "Not set" : data?.day || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
              />
            </GridDrawer>

            <GridDrawer
              icon={"ri-time-line"}
              title={isMobile ? "Start" : "Start / End"}
            >
              <div className="flex gap-[10px] items-center">
                <input
                  type="time"
                  name="start"
                  id="time"
                  defaultValue={`${empty ? "00:00" : data?.start || "Not set"}`}
                  className="bg-[#15171A] rounded-[4px] px-1  focus:ring-0 focus:border-none focus:outline-none max-w-full"
                />
                <span className="text-foreground-secondary hidden md:flex">
                  /
                </span>
                <input
                  type="time"
                  name="end"
                  id="time"
                  defaultValue={`${empty ? "00:30" : data?.end || "Not set"}`}
                  className="bg-[#15171A] rounded-[4px] px-1  focus:ring-0 focus:border-none focus:outline-none hidden md:flex max-w-full"
                />
              </div>
            </GridDrawer>

            <GridDrawer
              icon={"ri-time-line"}
              title={"End"}
              className={"flex md:hidden"}
            >
              <div className="flex gap-[10px] items-center">
                <input
                  type="time"
                  name="end"
                  id="time"
                  defaultValue={`${empty ? "00:30" :  data?.end || "Not set"}`}
                  className="bg-[#15171A] rounded-[4px] px-1  focus:ring-0 focus:border-none focus:outline-none max-w-full "
                />
              </div>
            </GridDrawer>

            <GridDrawer icon={"ri-door-closed-line"} title={"Room"}>
              <input
                type="text"
                name="room"
                defaultValue={`${empty ? "Not set" :  data?.room || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-weight-line"} title={"SKS"}>
              <input
                type="text"
                name="sks"
                defaultValue={`${empty ? "1" :  data?.sks || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none bg-drop-red text-red px-2 w-7 rounded-s max-w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-link"} title={"Link"}>
              <Link to={data?.link || "#"} target="_blank" rel="noopener noreferrer" className="absolute right-0 bg-black p-1 pl-4 rounded-[4px] -translate-y-[50%] top-[50%] shadow-md">
                <i className="ri-share-forward-line" />
              </Link>
              <input
                type="text"
                name="link"
                defaultValue={`${
                  empty ? "Not set" : data?.link || "Not set"
                }`}
                className="focus:ring-0 focus:outline-none focus:border-none underline text-blue-500 max-w-full w-full"
              />
            </GridDrawer>
          </div>
        </div>

        <div className="md:px-12 py-12 pt-20 md:pt-12 px-1  w-full flex justify-end gap-4 cursor-none">
          {empty ? (
            ""
          ) : (
            <button className="bg-[#830404] w-11 rounded-lg">
              <i className="ri-delete-bin-2-line text-[20px]"></i>
            </button>
          )}
          {empty ? (
            <Button variant="main" title="Add course" />
          ) : (
            <Button variant="main" icon="ri-edit-line" title="Save changes" />
          )}
        </div>
      </div>
    </div>
  );
};
