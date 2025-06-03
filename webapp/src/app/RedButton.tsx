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

export default function RedButton({
  onPress,
  minimized,
  setMinimized,
  onDouble,
  onHold,
}: {
  onPress: () => void;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  onDouble?: () => void;
  onHold?: () => void;
}) {
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [justDropped, setJustDropped] = useState<{ x: number; y: number } | false>(false);
  const [pointerDownPos, setPointerDownPos] = useState<{ x: number; y: number } | null>(null);
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);
  const holdFired = useRef(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef(0);

  // Drag logic
  useEffect(() => {
    if (!pointerDownPos) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if ("touches" in e && e.touches.length > 0) {
        e.preventDefault();
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

      if (!dragging && dist < 8 && !holdFired.current) {
        if (minimized && onDouble) {
          const now = Date.now();
          if (now - lastTapRef.current < 350) {
            // Double tap detected
            if (pressTimeoutRef.current) {
              clearTimeout(pressTimeoutRef.current);
              pressTimeoutRef.current = null;
            }
            lastTapRef.current = 0;
            onDouble();
          } else {
            // Schedule single tap
            lastTapRef.current = now;
            if (pressTimeoutRef.current) {
              clearTimeout(pressTimeoutRef.current);
              pressTimeoutRef.current = null;
            }
            pressTimeoutRef.current = setTimeout(() => {
              onPress();
              pressTimeoutRef.current = null;
              lastTapRef.current = 0;
            }, 350);
          }
          clearHold();
        } else if (minimized) {
          onPress();
          clearHold();
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
  }, [pointerDownPos, dragging, minimized, onPress, setMinimized, onDouble]);

  // Cancel hold if pointer moves too much
  useEffect(() => {
    if (!pointerDownPos) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      let x = 0, y = 0;
      if ("touches" in e && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if ("clientX" in e) {
        x = e.clientX;
        y = e.clientY;
      }
      const dx = x - pointerDownPos.x;
      const dy = y - pointerDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        if (holdTimeout.current) {
          clearTimeout(holdTimeout.current);
          holdTimeout.current = null;
          holdFired.current = false;
        }
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, [pointerDownPos]);

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
    const isMd = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    const margin = isMd ? 24 : 12;
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
    style.left = "50%";
    style.top = "50%";
    style.transform = "translate(-50%, -50%)";
    style.transition = "transform 0.7s cubic-bezier(.4,2,.6,1)";
  }

  // Helper to clear hold timer
  const clearHold = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
  };

  // Pointer down handler
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    let x = 0, y = 0;
    if ("touches" in e && e.touches.length > 0) {
      e.preventDefault();
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else if ("clientX" in e) {
      x = e.clientX;
      y = e.clientY;
    }
    setPointerDownPos({ x, y });

    // Hold detection
    if (onHold && minimized) {
      holdFired.current = false;
      holdTimeout.current = setTimeout(() => {
        holdFired.current = true;
        onHold();
      }, 1000);
    }
  };

  return (
    <div
      ref={btnRef}
      style={style}
      className={`redbtn-shadow ${minimized ? "cursor-grab" : "cursor-pointer"} ${dragging ? "dragging" : ""} select-none`}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      tabIndex={0}
      aria-label="Press the red button"
    >
      <div className="relative flex items-center justify-center select-none">
        <Image
          src="/red.png"
          alt="Red Button"
          width={minimized ? 80 : 180}
          height={minimized ? 80 : 180}
          className="rounded-full select-none pointer-events-none redbtn-pulse "
          draggable={false}
          priority
        />
      </div>
    </div>
  );
}