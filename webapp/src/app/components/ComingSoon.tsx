"use client";
import React from "react";

type ComingSoonProps = {
  description?: string;
};

export default function ComingSoon({
  description = "This product is coming soon. Stay tuned for updates!",
}: ComingSoonProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary transition-colors">
      <div className="flex flex-col items-center justify-center rounded-2xl shadow-lg p-10 border border-border/60 max-w-lg w-full mx-4">
        <h1 className="text-5xl text-center font-extrabold text-accent-text mb-4 drop-shadow opacity-0 animate-fadein">
          Coming Soon
        </h1>
        <p
          className="text-lg text-text-secondary text-center leading-relaxed opacity-0 animate-fadein"
          style={{ animationDelay: "750ms" }}
        >
          {description}
        </p>
        <a
          href="https://redbtn.io"
          className="mt-6 text-sm text-accent-text hover:text-accent-hover transition-colors underline opacity-0 animate-fadein"
          style={{ animationDelay: "1200ms" }}
        >
          Back to redbtn.io
        </a>
      </div>
    </div>
  );
}
