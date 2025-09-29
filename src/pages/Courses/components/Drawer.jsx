export const Drawer = ({ drawer, setDrawer }) => {
  return (
    <div className="absolute h-dvh w-full bg-black/20 z-[150] left-0 top-0">
      <div className="absolute w-[624px] h-full bg-black right-0 border-2 border-border rounded-l-[24px] p-6">
        <button>
          <i className="ri-arrow-right-double-line text-[32px] text-foreground-secondary"></i>
        </button>

        <div className="pt-16 px-12 pb-12 flex flex-col">
          <textarea type="text" defaultValue={"Manajemen Projek TIK"} className="font-bold text-[48px]" rows={2} />
        </div>

        <div></div>
      </div>
    </div>
  );
};
