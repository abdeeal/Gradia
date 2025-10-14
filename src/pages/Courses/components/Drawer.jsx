import { useRef, useLayoutEffect, useEffect } from "react";
import gsap from "gsap";
import GridDrawer from "./GridDrawer";
import { Button } from "../../../components/Button";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router-dom";
import SelectUi from "@/components/Select";
import { SelectItem, SelectLabel } from "@/components/ui/select";

export const Drawer = ({ drawer, setDrawer, empty, data }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);

  const safePhone = data?.phone ? String(data.phone).trim() : null;
  const safeLink = data?.link ? String(data.link).trim() : null;

  const safeUrl = (str, prefix = "") => {
    try {
      if (!str) return "#";
      return new URL(str.startsWith("http") ? str : prefix + str).href;
    } catch {
      return "#";
    }
  };

  const waLink = safeUrl(safePhone, "https://wa.me/");
  const externalLink = safeUrl(safeLink);

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const closeDrawer = () => {
    setDrawer(false);
  };

  useEffect(() => {
    const handleError = (event) => {
      if (
        event.message.includes("Failed to execute 'removeChild' on 'Node'") ||
        event.message.includes(
          "The node to be removed is not a child of this node"
        )
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
              defaultValue={`${empty ? "" : data?.name || "Not set"}`}
              className="font-bold text-[48px] focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
              rows={2}
              placeholder="Enter your course title"
            />
          </div>

          <div className="grid px-1 md:px-12 grid-cols-2 grid-rows-9 w-full gap-6 text-[16px]">
            <GridDrawer icon={"ri-hashtag"} title={"Alias"}>
              <input
                type="text"
                name="alias"
                defaultValue={`${empty ? "" : data?.alias || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none  max-w-full w-full h-full"
                placeholder="Not set"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-graduation-cap-line"} title={"Lecturer"}>
              <input
                type="text"
                name="lecturer"
                defaultValue={`${empty ? "" : data?.lecturer || "Not set"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
                placeholder="Not set"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-phone-line"} title={"Phone"}>
              {safePhone ? (
                <a
                  href={waLink}
                  className="absolute right-0 p-1 pl-4 rounded-[4px] -translate-y-[50%] top-[50%]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="ri-whatsapp-line" />
                </a>
              ) : null}
              <input
                type="text"
                name="phone"
                defaultValue={`${empty ? "" : data?.phone || "08000000"}`}
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
                placeholder="Not set"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-calendar-event-line"} title={"Day"}>
              <SelectUi
                placeholder={"Select a day"}
                defaultValue={`${empty ? "" : data?.day || ""}`}
              >
                <SelectLabel>Day</SelectLabel>
                {dayOrder.map((item, idx) => (
                  <SelectItem key={idx} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectUi>
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
                  defaultValue={`${empty ? "00:30" : data?.end || "Not set"}`}
                  className="bg-[#15171A] rounded-[4px] px-1  focus:ring-0 focus:border-none focus:outline-none max-w-full "
                />
              </div>
            </GridDrawer>

            <GridDrawer icon={"ri-door-closed-line"} title={"Room"}>
              <input
                type="text"
                name="room"
                defaultValue={`${empty ? "" : data?.room || ""}`}
                placeholder="Not set"
                className="focus:ring-0 focus:outline-none focus:border-none max-w-full w-full"
              />
            </GridDrawer>

            <GridDrawer icon={"ri-weight-line"} title={"SKS"}>
              <SelectUi
                placeholder="1"
                defaultValue={empty ? 1 : data?.sks || ""}
                valueClassFn={(val) => {
                  if (val === 2) return "bg-drop-yellow text-yellow px-3";
                  if (val === 1) return "bg-drop-cyan text-cyan px-3";
                  return "bg-drop-red text-red px-3"; 
                }}
              >
                <SelectLabel>SKS</SelectLabel>
                {[1, 2, 3].map((sks) => (
                  <SelectItem key={sks} value={sks}>
                    {sks}
                  </SelectItem>
                ))}
              </SelectUi>
            </GridDrawer>

            <GridDrawer icon={"ri-link"} title={"Link"}>
              {safeLink ? (
                <a
                  href={externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-0 bg-black p-1 pl-4 rounded-[4px] -translate-y-[50%] top-[50%] shadow-md"
                >
                  <i className="ri-share-forward-line" />
                </a>
              ) : null}
              <input
                type="text"
                name="link"
                defaultValue={`${empty ? "" : data?.link || ""}`}
                placeholder="Not set"
                className="focus:ring-0 focus:outline-none focus:border-none underline text-blue-500 max-w-full w-full"
              />
            </GridDrawer>
          </div>
        </div>

        <div className="md:px-12 py-6 pt-20 md:pt-12 px-1  w-full flex justify-end gap-4 cursor-none">
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
