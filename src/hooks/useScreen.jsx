import { useEffect, useState } from "react";

export default function useScreen() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);

    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return {
    width,
    isMobile: width <= 767,
    isTablet: width >= 768 && width <= 1024,
    isDesktop: width > 1024,
  };
}
