"use client";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

function getNearestCorner(x: number, y: number, width: number, height: number): Corner {
  const corners: [Corner, number, number][] = [
    ["top-left", 0, 0],
    ["top-right", width, 0],
    ["bottom-left", 0, height],
    ["bottom-right", width, height],
  ];
  let minDist = Infinity;
  let nearest: Corner = "bottom-right";
  for (const [corner, cx, cy] of corners) {
    const dist = Math.hypot(x - cx, y - cy);
    if (dist < minDist) {
      minDist = dist;
      nearest = corner;
    }
  }
  return nearest;
}

// Helper to get transform for each corner
// function getTransform(minimized: boolean, corner: Corner) { ... }

export default function RedButton({
  onPress,
  minimized,
  setMinimized,
}: {
  onPress: () => void;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
}) {
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [justDropped, setJustDropped] = useState<{ x: number; y: number } | false>(false);
  const [pointerDownPos, setPointerDownPos] = useState<{ x: number; y: number } | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  // Animate pulse
  // (Tailwind's animate-pulse is too fast, so use custom CSS below)

  // Drag logic
  useEffect(() => {
    if (!pointerDownPos) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e && e.touches.length > 0) {
        e.preventDefault(); // Prevent scrolling on mobile while dragging
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        if (!dragging && pointerDownPos) {
          const dx = x - pointerDownPos.x;
          const dy = y - pointerDownPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 8) {
            setDragging(true);
          }
        }
        if (dragging) {
          setDragPos({ x, y });
        }
      } else if ("clientX" in e) {
        const x = e.clientX;
        const y = e.clientY;
        if (!dragging && pointerDownPos) {
          const dx = x - pointerDownPos.x;
          const dy = y - pointerDownPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 8) {
            setDragging(true);
          }
        }
        if (dragging) {
          setDragPos({ x, y });
        }
      }
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      let x = 0, y = 0;
      if ("changedTouches" in e && e.changedTouches.length > 0) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      } else if ("clientX" in e) {
        x = e.clientX;
        y = e.clientY;
      }
      const dx = x - pointerDownPos.x;
      const dy = y - pointerDownPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!dragging && dist < 8) {
        // Treat as click
        if (minimized) {
          onPress();
        } else {
          setMinimized(true);
        }
      } else if (dragging) {
        setDragging(false);
        setDragPos(null);
        setJustDropped({ x, y });
        setTimeout(() => {
          const nearest = getNearestCorner(x, y, window.innerWidth, window.innerHeight);
          setCorner(nearest);
          setJustDropped(false);
        }, 10);
      }
      setPointerDownPos(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [pointerDownPos, dragging, minimized, onPress, setMinimized]);

  // Positioning
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: minimized ? 100 : 50,
    pointerEvents: dragging ? "none" : "auto",
    width: minimized ? 100 : 180,
    height: minimized ? 100 : 180,
    transition: "left 0.5s cubic-bezier(.4,2,.6,1), top 0.5s cubic-bezier(.4,2,.6,1)",
  };

  if (dragging && dragPos && minimized) {
    style.left = dragPos.x - 40;
    style.top = dragPos.y - 40;
    style.transition = "none";
  } else if (justDropped && minimized && typeof justDropped === "object") {
    style.left = justDropped.x - 40;
    style.top = justDropped.y - 40;
    style.transition = "none";
  } else if (minimized) {
    // Snap to corner using left/top
    const margin = 24;
    switch (corner) {
      case "top-left":
        style.left = margin;
        style.top = margin;
        break;
      case "top-right":
        style.left = window.innerWidth - margin - 100;
        style.top = margin;
        break;
      case "bottom-left":
        style.left = margin;
        style.top = window.innerHeight - margin - 100;
        break;
      case "bottom-right":
        style.left = window.innerWidth - margin - 100;
        style.top = window.innerHeight - margin - 100;
        break;
    }
  } else {
    // Centered
    style.left = "50%";
    style.top = "50%";
    style.transform = "translate(-50%, -50%)";
    style.transition = "transform 0.7s cubic-bezier(.4,2,.6,1)";
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e && e.touches.length > 0) {
      e.preventDefault(); // Prevent scroll on touch start
      let x = e.touches[0].clientX;
      let y = e.touches[0].clientY;
      setPointerDownPos({ x, y });
    } else if ("clientX" in e) {
      let x = e.clientX;
      let y = e.clientY;
      setPointerDownPos({ x, y });
    }
  };

  return (
    <div
      ref={btnRef}
      style={style}
      className={`redbtn-shadow ${minimized ? "cursor-grab" : "cursor-pointer"} ${dragging ? "dragging" : ""}`}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      tabIndex={0}
      aria-label="Press the red button"
    >
      <div className="relative flex items-center justify-center">
        <Image
          src="/red.png"
          alt="Red Button"
          width={minimized ? 80 : 180}
          height={minimized ? 80 : 180}
          className="rounded-full select-none pointer-events-none redbtn-pulse"
          draggable={false}
          priority
        />
      </div>
    </div>
  );
}