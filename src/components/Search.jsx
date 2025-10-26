export const Search = ({ className, value, onChange, placeholder = "Search" }) => {
  return (
    <div
      className={`${className} group focus-within:border-white flex gap-3 px-[10px] py-[4px] items-center border border-border rounded-[8px] hover:bg-white/10`}
    >
      <i className="ri-search-line text-[24px]"></i>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus:outline-none focus:ring-0 border-none bg-transparent w-full"
      />
    </div>
  );
};
