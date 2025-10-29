// Pagination.jsx
import React from "react";

const Pagination = ({ page, totalPages, setPage }) => {
  const getPages = (current, total, maxVisible) => {
    if (total <= maxVisible) return [...Array(total)].map((_, i) => i + 1);

    // Sliding window
    let start = Math.max(1, current - 1);
    let end = start + maxVisible - 1;

    if (end > total) {
      end = total;
      start = end - maxVisible + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="flex justify-between items-center mt-4 text-sm w-full max-w-[800px] -translate-y-[50%]">
      {/* Previous Button */}
      <button
        onClick={() => setPage((p) => Math.max(p - 1, 1))}
        className="px-2 py-1 bg-[#141414] border border-[#2c2c2c] rounded disabled:opacity-40"
        disabled={page === 1}
      >
        Previous
      </button>

      {/* Number Buttons */}
      <div className="flex gap-2">
        {getPages(page, totalPages, 4).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-2 py-1 rounded ${
              p === page
                ? "bg-[#2c2c2c]"
                : "bg-[#141414] hover:bg-[#1a1a1a]"
            }`}
          >
            {String(p).padStart(2, "0")}
          </button>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        className="px-2 py-1 bg-[#141414] border border-[#2c2c2c] rounded disabled:opacity-40"
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
