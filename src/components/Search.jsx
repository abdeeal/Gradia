export const Search = () => {
  return (
    <div className="group focus-within:border-white flex gap-3 px-[10px] py-[4px] items-center border border-border rounded-[8px] hover:bg-white">
      <i className="ri-search-line text-[24px]"></i>
      <input type="text" placeholder="search" className="focus:outline-none focus:ring-0 border-none bg-transparent" />
    </div>
  )
}
