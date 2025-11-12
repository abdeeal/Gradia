import React from "react";
import Mobile from "./Layout/Mobile";
import { useMediaQuery } from "react-responsive";

const VerifyOtp = ({ email, expiredAt, from, user, purpose }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet)
    return (
      <Mobile email={email} expiredAt={expiredAt} from={from} user={user} purpose={purpose} />
    );
  return (
    <div>
      VerifyOtp
      <div></div>
    </div>
  );
};

export default VerifyOtp;
