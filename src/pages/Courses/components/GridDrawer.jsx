const GridDrawer = ({icon, title, children, className}) => {
  return (
    <>
      <div className={`${className} flex gap-2 relative items-center`}>
            <i className={`${icon} text-[18px]`}></i>
            <p>{title}</p>
          </div>
          <div className={`${className} w-fit h-fit relative flex items-center h-full`}>
            {children}
          </div>
    </>
  )
}

export default GridDrawer