"use client";
import React, { useRef, useEffect } from "react";

export default function Content({
  children,
  onUserScroll,
}: {
  children: React.ReactNode;
  onUserScroll?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Prevent vertical swipe propagation if can scroll
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el || touchStartY.current === null) return;

    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY.current;

    // Check if at top or bottom
    if (
      (el.scrollTop === 0 && diffY > 0) || // at top, swiping down
      (el.scrollTop + el.clientHeight >= el.scrollHeight && diffY < 0) // at bottom, swiping up
    ) {
      // allow parent to handle
      return;
    }
    // Otherwise, prevent parent scroll and trigger cooldown
    e.stopPropagation();
    if (onUserScroll) onUserScroll();
  };

  // Native wheel event for non-passive preventDefault
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const deltaY = e.deltaY;
      const atTop = el.scrollTop === 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

      // Only stop propagation if the card can scroll in the direction of the wheel
      if (
        (deltaY < 0 && !atTop) || // scrolling up, not at top
        (deltaY > 0 && !atBottom) // scrolling down, not at bottom
      ) {
        e.stopPropagation();
        if (onUserScroll) onUserScroll();
      }
      // Do NOT call e.preventDefault() here!
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onUserScroll]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <div
        ref={scrollRef}
        className="relative bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow-xl p-4 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mb-8 border border-zinc-200 dark:border-zinc-800 max-h-[80vh] overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {children}
      </div>
    </div>
  );
}