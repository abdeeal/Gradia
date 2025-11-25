// 📄 components/Delete.jsx
import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import FrameIcon from "@/assets/Frame.svg";

export default function DeletePopup({
  title = "Delete Workspace",
  warning = "Are you sure you want to delete this workspace?",
  onCancel = () => {},
  onDelete = () => {},
  autoClose = true, // NEW: control auto close behavior (default: true)
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true); // NEW: local visible state

  useEffect(() => setMounted(true), []);

  // Lock scroll + ESC close
  useEffect(() => {
    if (!mounted || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && handleCancel();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, open]);

  const handleCancel = useCallback(() => {
    if (autoClose) setOpen(false);  // close immediately
    onCancel?.();                   // notify parent to flip state
  }, [autoClose, onCancel]);

  const handleDelete = useCallback(async () => {
    // Tutup duluan biar terasa instan
    if (autoClose) setOpen(false);
    // Jalankan aksi delete dari parent
    try {
      await Promise.resolve(onDelete?.());
    } catch {
      // biarkan parent yang tampilkan error toast
    }
  }, [autoClose, onDelete]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center px-4"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      aria-describedby="delete-desc"
    >
      {/* Outer container */}
      <div
        className="w-[676px] bg-[#15171A] text-white rounded-xl flex flex-col font-inter shadow-[0_0_40px_rgba(0,0,0,0.5)] p-[20px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full mb-3">
          <h2 id="delete-title" className="text-[24px] font-semibold text-center">
            {title}
          </h2>
        </div>

        {/* Inner card */}
        <div
          className="rounded-xl p-[16px] flex flex-col items-center"
          style={{
            background: "linear-gradient(180deg, #070707 0%, #141414 100%)",
          }}
        >
          {/* Icon */}
          <img src={FrameIcon} alt="Warning" className="w-[81px] h-[81px] mb-[24px]" />

          {/* Warning text */}
          <p id="delete-desc" className="text-[20px] tracking-[-0.02em] mb-[12px] text-center">
            {warning}
          </p>

          {/* Description */}
          <p className="text-[#A3A3A3] text-center mb-[12px] leading-snug">
            This action cannot be undone,
            <br />
            and all related data will be permanently removed.
          </p>

          {/* Divider & Buttons */}
          <div className="w-full border-t border-[#656565]/50 mt-2 pt-[13px] flex justify-end gap-[10px]">
            {/* Cancel */}
            <button
              onClick={handleCancel}
              className="bg-[#6B7280]/20 text-white text-[16px] px-[12px] py-[8px] rounded-[8px] transition-colors hover:bg-[#6B7280]/30 cursor-pointer"
            >
              Cancel
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="flex items-center bg-[#EF4444]/20 text-[#F87171] text-[16px] px-[12px] py-[8px] rounded-[8px] transition-colors hover:bg-[#EF4444]/30 cursor-pointer"
            >
              <span className="mr-[8px]">Delete</span>
              <i className="ri-delete-bin-5-line text-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
