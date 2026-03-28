"use client";
import React from "react";

type ComingSoonProps = {
  description?: string;
};

export default function ComingSoon({
  description = "This product is coming soon. Stay tuned for updates!",
}: ComingSoonProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-950 transition-colors">
      <div className="flex flex-col items-center justify-center rounded-2xl shadow-lg p-10 border border-zinc-200/60 dark:border-zinc-800/60 max-w-lg w-full mx-4">
        <h1 className="text-5xl text-center font-extrabold text-red-600 mb-4 drop-shadow opacity-0 animate-fadein">
          Coming Soon
        </h1>
        <p
          className="text-lg text-zinc-600 dark:text-zinc-300 text-center leading-relaxed opacity-0 animate-fadein"
          style={{ animationDelay: "750ms" }}
        >
          {description}
        </p>
        <a
          href="https://redbtn.io"
          className="mt-6 text-sm text-red-600 hover:text-red-700 transition-colors underline opacity-0 animate-fadein"
          style={{ animationDelay: "1200ms" }}
        >
          Back to redbtn.io
        </a>
      </div>
    </div>
  );
}
