const GridDrawer = ({icon, title, children, className}) => {
  return (
    <>
      <div className={`${className} flex gap-2 relative`}>
            <i className={`${icon} text-[18px]`}></i>
            <p>{title}</p>
          </div>
          <div className={`${className} w-fit h-fit relative`}>
            {children}
          </div>
    </>
  )
}

export default GridDrawer