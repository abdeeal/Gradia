import React from 'react'
import { useMediaQuery } from 'react-responsive';
import Mobile from './Layout/Mobile';

const Calendar = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet) return <Mobile />;
  return (
    <div>
      aa
      <div></div>
    </div>
  );
}

export default Calendar