import { Tab } from './layouts/Tab';
import { useMediaQuery } from "react-responsive";

export const Courses = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1024 });
  const isDesktop = useMediaQuery({ minWidth: 1025 });

  return (
    <div>
      {isTablet && (<Tab />)}
      {isMobile && (<Tab />)}
      {isDesktop && (
        <div>Tampilan courses desktop taro sini</div>
      )}
    </div>
  )
}
