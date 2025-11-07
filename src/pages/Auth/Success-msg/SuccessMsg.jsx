import React from 'react'
import Mobile from './Layout/Mobile';
import { useMediaQuery } from 'react-responsive';

const SuccessMsg = (type) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });

  if (isMobile || isTablet)
    return (
      <Mobile type={type} />
    );
  return (
    <div>SuccessMsg</div>
  )
}

export default SuccessMsg