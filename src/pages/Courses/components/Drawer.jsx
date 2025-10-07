import { useRef, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import GridDrawer from "./GridDrawer";
import { Button } from "../../../components/Button";
import { useMediaQuery } from "react-responsive";

export const Drawer = ({ drawer, setDrawer, empty }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  const closeDrawer = () => {
    setDrawer(false);
  };

  useLayoutEffect(() => {
    if (drawer) {
      gsap.fromTo(
        drawerRef.current,
        {
          filter: "blur(16px)",
        },
        {
          x: 0,
          duration: 1,
          filter: "blur(0px)",
          ease: "power3.out",
        }
      );
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
        className="absolute w-full max-w-full md:w-[624px] h-full bg-black right-0 md:border-2 border-border md:rounded-l-[24px] p-4 md:p-6 flex flex-col justify-between overflow-y-auto"
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
                empty ? "Course title" : "Manajemen Projek TIK"
              }`}
              className="font-bold text-[48px] focus:ring-0 focus:outline-none focus:border-none max-w-full"
              rows={2}
            />
          </div>

          <div className="grid px-1 md:px-12 grid-cols-2 grid-rows-9 w-full gap-6 text-[16px]">
            <GridDrawer icon={"ri-hashtag"} title={"Alias"}>
              <input
                type="text"
                name="alias"
                defaultValue={`${empty ? "Not set" : "Mapro"}`}
                className="focus:ring-0 focus:outline-none focus:border-none  max-w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-graduation-cap-line"} title={"Lecturer"}>
              <input
                type="text"
                name="lecturer"
                defaultValue={`${empty ? "Not set" : "Susilo Widoyono"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-phone-line"} title={"Phone"}>
              <input
                type="text"
                name="phone"
                defaultValue={`${empty ? "Not set" : "08123456789"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-calendar-event-line"} title={"Day"}>
              <input
                type="text"
                name="day"
                defaultValue={`${empty ? "Not set" : "Monday"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full"
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
                  defaultValue={`${empty ? "00:00" : "06:30"}`}
                  className="bg-[#15171A] rounded-[4px] px-1  focus:ring-0 focus:border-none focus:outline-none max-w-full"
                />
                <span className="text-foreground-secondary hidden md:flex">
                  /
                </span>
                <input
                  type="time"
                  name="end"
                  id="time"
                  defaultValue={`${empty ? "00:30" : "09:30"}`}
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
                  defaultValue={`${empty ? "00:30" : "09:30"}`}
                  className="bg-[#15171A] rounded-[4px] px-1  focus:ring-0 focus:border-none focus:outline-none max-w-full"
                />
              </div>
            </GridDrawer>

            <GridDrawer icon={"ri-door-closed-line"} title={"Room"}>
              <input
                type="text"
                name="room"
                defaultValue={`${empty ? "Not set" : "REK - 203"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-weight-line"} title={"SKS"}>
              <input
                type="text"
                name="sks"
                defaultValue={`${empty ? "1" : "3"}`}
                className="focus:ring-0 focus:outline-none focus:border-none bg-drop-red text-red px-2 w-7 rounded-s max-w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-link"} title={"Link"}>
              <input
                type="text"
                name="link"
                defaultValue={`${
                  empty ? "Not set" : "https://www.telkomuniversity.ac.id"
                }`}
                className="focus:ring-0 focus:outline-none focus:border-none underline text-blue-500 max-w-full"
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
