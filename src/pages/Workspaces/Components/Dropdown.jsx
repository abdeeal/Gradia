import React from "react"; 

export default function Dropdown() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        backgroundColor: "#141414",
        width: "170px",
        height: "98px",
        padding: "10px",
      }}
    >
      {/* Tombol Edit */}
      <button
        className="flex items-center justify-center gap-2 text-white font-inter cursor-pointer"
        style={{ fontSize: "14px" }}
      >
        <i className="ri-edit-line text-[16px]" />
        Edit
      </button>

      {/* Jarak antar tombol */}
      <div style={{ height: "24px" }} />

      {/* Tombol Delete */}
      <button
        className="flex items-center justify-center gap-2 text-white font-inter cursor-pointer"
        style={{ fontSize: "14px" }}
      >
        <i className="ri-delete-bin-fill text-[16px]" />
        Delete
      </button>
    </div>
  );
}
