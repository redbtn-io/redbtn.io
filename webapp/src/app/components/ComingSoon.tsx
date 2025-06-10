"use client";
import React from "react";

type ComingSoonProps = {
  description?: string;
};

export default function ComingSoon({
  description = "This product is coming soon. Stay tuned for updates!",
}: ComingSoonProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 transition-colors">
      <div className="flex flex-col items-center justify-center rounded-xl shadow-2xl p-10 border border-zinc-200 dark:border-zinc-800 max-w-lg w-full mx-4 mb-40">
        <h1 className="text-5xl font-extrabold text-red-700 mb-4 drop-shadow opacity-0 animate-fadein">
          Coming Soon
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-200 text-center opacity-0 animate-fadein" style={{ animationDelay: "750ms" }}>
          {description}
        </p>
      </div>
    </div>
  );
}