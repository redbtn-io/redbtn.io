import React from "react";

export default function LoadingWheel({ size = 40, color = "#dc2626" }: { size?: number; color?: string }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={{ display: "block" }}
      aria-label="Loading"
    >
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke={color}
        strokeWidth="5"
        strokeDasharray="80"
        strokeDashoffset="60"
        strokeLinecap="round"
        opacity="0.25"
      />
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke={color}
        strokeWidth="5"
        strokeDasharray="40"
        strokeDashoffset="10"
        strokeLinecap="round"
      />
    </svg>
  );
}