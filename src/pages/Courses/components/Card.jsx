export const CourseCard = ({ start, end, title, alias, room, lecturer, sks, setDrawer }) => {

  const dotColor = sks == 3 ? "bg-red" : sks == 2 ? "bg-yellow" : "bg-blue";

  const openDrawer = () => {
    setDrawer(true)
  }

  return (
    <button onClick={openDrawer} className="w-[251px] h-full bg-background rounded-[8px] p-3 flex flex-col justify-between gap-2 group focus-within:border focus-within:border-border">
      <div className="flex gap-[10px] items-center">
        <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>
        <p className="text-foreground-secondary">{start} - {end}</p>
      </div>
      <p className="font-semibold text-start">{title}({alias})</p>
      <div className="flex flex-col gap-1 text-foreground-secondary">
        <div className="flex gap-[10px]">
          <i className="ri-door-closed-line text-icon"></i>
          <p className="font-semibold">{room}</p>
        </div>
        <div className="flex gap-[10px]">
          <i className="ri-graduation-cap-line text-icon"></i>
          <p>{lecturer}</p>
        </div>
      </div>
    </button>
  );
};
