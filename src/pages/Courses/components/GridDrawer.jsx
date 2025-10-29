const GridDrawer = ({ icon, title, children, className }) => {
  return (
    <>
      <div className={`${className} flex gap-2 relative items-center h-fit`}>
        <i className={`${icon} text-[18px]`}></i>
        <p>{title}</p>
      </div>
      <div className={`w-fit relative flex items-center h-fit ${className}`}>
        {children}
      </div>
    </>
  );
};

export default GridDrawer;
