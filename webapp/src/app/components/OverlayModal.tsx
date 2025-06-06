import React from "react";

type OverlayModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeable?: boolean; // Renamed from showTopCloseButton
};

export default function OverlayModal({
  open,
  onClose,
  children,
  closeable = true, // Default to true
}: OverlayModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center" // was z-20
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        style={{ opacity: 0.7, zIndex: 10 }} // overlay at 10
        onClick={closeable ? onClose : undefined}
      />
      {/* Modal box */}
      <div className="relative z-15 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 flex flex-col items-end">
        {closeable && (
          <button
            aria-label="Close"
            className="absolute top-3 right-3 text-2xl text-zinc-500 hover:text-red-600 font-bold focus:outline-none cursor-pointer"
            onClick={onClose}
            tabIndex={0}
          >
            ×
          </button>
        )}
        <div className="w-full pt-2">{children}</div>
      </div>
    </div>
  );
}