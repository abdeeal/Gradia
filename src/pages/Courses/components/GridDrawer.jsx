const GridDrawer = ({icon, title, children}) => {
  return (
    <>
      <div className="flex gap-2">
            <i className={`${icon} text-[18px]`}></i>
            <p>{title}</p>
          </div>
          <div>
            {children}
          </div>
    </>
  )
}

export default GridDrawer