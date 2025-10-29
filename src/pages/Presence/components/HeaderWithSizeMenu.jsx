import React, { useState, useRef } from "react";

export default function HeaderWithSizeMenu({
  rowsPerPage,
  setRowsPerPage,
  setPage,
}) {
  const [openSizeMenu, setOpenSizeMenu] = useState(false);
  const sizeMenuRef = useRef(null);
  const pageOptions = [5, 10, 15, 20, 25];
  const pillFill = "bg-[#141414] border border-[#2c2c2c]";

  return (
    <div className="flex justify-between items-center mb-3 border-b border-border/50 py-3">
      <h1 className="text-lg font-semibold text-foreground">Log Presence</h1>

      {/* Dropdown "Showing" */}
      <div ref={sizeMenuRef} className="relative">
        <div className="flex items-center gap-2 text-foreground-secondary">
          <span>Showing</span>

          {/* Tombol angka aktif */}
          <button
            onClick={() => setOpenSizeMenu((v) => !v)}
            className={`h-7 min-w-9 px-2 rounded-md ${pillFill} text-foreground-secondary`}
            title="Change rows per page"
          >
            {rowsPerPage}
          </button>

          {/* Tombol icon panah */}
          <button
            onClick={() => setOpenSizeMenu((v) => !v)}
            className={`h-7 w-7 grid place-items-center rounded-md ${pillFill} text-foreground`}
            aria-label="Toggle page size menu"
            title="Toggle page size menu"
          >
            <i
              className={`ri-arrow-${
                openSizeMenu ? "up" : "down"
              }-s-fill text-base`}
            />
          </button>
        </div>

        {/* Menu dropdown */}
        {openSizeMenu && (
          <ul className="absolute right-0 mt-2 w-24 rounded-md border border-[#2c2c2c] bg-[#141414] shadow-lg z-80 py-1">
            {pageOptions.map((opt) => (
              <li key={opt}>
                <button
                  onClick={() => {
                    setRowsPerPage(opt);
                    setPage(1);
                    setOpenSizeMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-base transition-colors ${
                    opt === rowsPerPage
                      ? "text-foreground bg-[#1e1e1e]"
                      : "text-foreground-secondary hover:bg-[#1e1e1e]"
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
