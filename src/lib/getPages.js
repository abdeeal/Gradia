import React from "react";

// Fungsi helper pagination dengan ellipsis
function getPages(pageIndex, totalPages, maxVisible = 4) {
  const page = pageIndex + 1; // konversi ke 1-based
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];
  const siblingCount = Math.max(1, maxVisible - 2); // sisakan 2 untuk first & last

  let start = Math.max(2, page - Math.floor(siblingCount / 2));
  let end = Math.min(totalPages - 1, start + siblingCount - 1);

  // koreksi start kalau end terpotong di ujung
  start = Math.max(2, end - siblingCount + 1);

  pages.push(1);
  if (start > 2) pages.push("...");

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);

  return pages;
}

export default getPages

