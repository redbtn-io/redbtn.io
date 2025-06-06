import React from "react";

type Props = {
  show: boolean;
  onClose?: () => void;
  children: React.ReactNode;
};

export default function ChatBubble({ show, onClose, children }: Props) {
  if (!show) return null;
  return (
    <div
      className={`
        fixed inset-0 z-[200] flex items-center justify-center bg-black/60 transition-opacity
        ${show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative bg-white dark:bg-zinc-900 shadow-2xl rounded-xl px-6 py-8 max-w-lg w-full mx-4">
        {onClose && (
          <button
            className="absolute top-3 right-3 text-2xl text-zinc-400 hover:text-red-500 font-bold focus:outline-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
        <div className="text-base">{children}</div>
      </div>
    </div>
  );
}