import React from "react";
import Mobile from "./Layout/Mobile";
import { useMediaQuery } from "react-responsive";

const Workspaces = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) return <Mobile />;
  return (
    <div>
      aa
      <div></div>
    </div>
  );
};

export default Workspaces;
