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
  bounce = false,
  onCornerChange,
  onPositionChange,
  style: externalStyle, // <-- add this
}: {
  onPress: () => void;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  onDouble?: () => void;
  onHold?: () => void;
  bounce?: boolean;
  onCornerChange?: (corner: Corner) => void;
  onPositionChange?: (pos: { x: number; y: number }) => void;
  style?: React.CSSProperties; // <-- add this
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

  // Drag logic
  useEffect(() => {
    if (!pointerDownPos) return;

    // Hold detection
    holdFired.current = false;
    if (onHold && minimized) {
      holdTimeout.current = setTimeout(() => {
        if (!dragging && !holdFired.current) {
          holdFired.current = true;
          onHold();
        }
      }, 1000);
    }

    const onMove = (e: MouseEvent | TouchEvent) => {
      let x = 0, y = 0;
      if ("touches" in e && e.touches.length > 0) {
        e.preventDefault();
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if ("clientX" in e) {
        x = e.clientX;
        y = e.clientY;
      }
      if (!dragging && pointerDownPos) {
        const dx = x - pointerDownPos.x;
        const dy = y - pointerDownPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 8) {
          setDragging(true);
          // Cancel hold if drag starts
          if (holdTimeout.current) {
            clearTimeout(holdTimeout.current);
            holdTimeout.current = null;
          }
          holdFired.current = false;
        }
      }
      if (dragging) {
        setDragPos({ x, y });
      }
    };

    const onUp = (e: MouseEvent | TouchEvent) => {
      if (holdTimeout.current) {
        clearTimeout(holdTimeout.current);
        holdTimeout.current = null;
      }

      let x = 0, y = 0;
      if ("changedTouches" in e && e.changedTouches.length > 0) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      } else if ("clientX" in e) {
        x = e.clientX;
        y = e.clientY;
      }

      if (dragging) {
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
      holdFired.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);

    // Fix: copy ref values for cleanup
    const holdTimeoutCurrent = holdTimeout.current;
    const pressTimeoutCurrent = pressTimeoutRef.current;

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      if (holdTimeoutCurrent) clearTimeout(holdTimeoutCurrent);
      if (pressTimeoutCurrent) clearTimeout(pressTimeoutCurrent);
    };
  }, [pointerDownPos, dragging, minimized, onPress, setMinimized, onDouble, onHold]);

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
        }
        holdFired.current = false;
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, [pointerDownPos]);

  // PointerEvents for tap/double/hold (only if not dragging)
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    // Use refs so state persists across renders
    const pointerDownPos = { current: null as { x: number; y: number } | null };
    const holdTimeoutLocal = { current: null as NodeJS.Timeout | null };
    const lastTapTime = { current: 0 };
    const tapTimeout = { current: null as NodeJS.Timeout | null };
    const doubleTapLock = { current: false };

    const clearHold = () => {
      if (holdTimeoutLocal.current) {
        clearTimeout(holdTimeoutLocal.current);
        holdTimeoutLocal.current = null;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (dragging) return;
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
      doubleTapLock.current = false;

      // Hold detection
      if (onHold && minimized) {
        holdTimeoutLocal.current = setTimeout(() => {
          if (!dragging && !holdFired.current) {
            holdFired.current = true;
            onHold();
          }
        }, 1000);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (dragging) return;
      clearHold();

      const x = e.clientX;
      const y = e.clientY;
      const dist = pointerDownPos.current
        ? Math.hypot(x - pointerDownPos.current.x, y - pointerDownPos.current.y)
        : 0;

      if (dist < 8 && !holdFired.current) {
        const now = Date.now();
        if (minimized && onDouble) {
          if (lastTapTime.current && now - lastTapTime.current < 350 && !doubleTapLock.current) {
            doubleTapLock.current = true;
            if (tapTimeout.current) {
              clearTimeout(tapTimeout.current);
              tapTimeout.current = null;
            }
            lastTapTime.current = 0;
            onDouble();
          } else {
            lastTapTime.current = now;
            if (tapTimeout.current) clearTimeout(tapTimeout.current);
            tapTimeout.current = setTimeout(() => {
              if (!doubleTapLock.current) {
                onPress();
              }
              lastTapTime.current = 0;
              tapTimeout.current = null;
            }, 350);
          }
        } else if (minimized) {
          onPress();
        } else {
          setMinimized(true);
        }
      }
      pointerDownPos.current = null;
      holdFired.current = false;
    };

    btn.addEventListener("pointerdown", onPointerDown);
    btn.addEventListener("pointerup", onPointerUp);

    return () => {
      btn.removeEventListener("pointerdown", onPointerDown);
      btn.removeEventListener("pointerup", onPointerUp);
      clearHold();
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
    };
  }, [dragging, minimized, onPress, setMinimized, onDouble, onHold]);

  // Corner change effect
  useEffect(() => {
    if (onCornerChange) onCornerChange(corner);
  }, [corner, onCornerChange]);

  // Report position to parent
  useEffect(() => {
    if (!btnRef.current || !onPositionChange) return;
    const rect = btnRef.current.getBoundingClientRect();
    onPositionChange({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [corner, minimized, dragging, dragPos, justDropped, onPositionChange]);

  // Positioning
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: minimized ? 20 : 15,
    pointerEvents: dragging ? "none" : "auto",
    width: minimized ? 100 : 180,
    height: minimized ? 100 : 180,
    transition: "left 0.5s cubic-bezier(.4,2,.6,1), top 0.5s cubic-bezier(.4,2,.6,1)",
    ...externalStyle, // <-- merge external style last
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
        style.top = margin*3;
        break;
      case "top-right":
        style.left = window.innerWidth - margin - 100;
        style.top = margin*3;
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

  return (
    <div
      ref={btnRef}
      style={style}
      className={`redbtn-shadow cursor-pointer ${dragging ? "dragging" : ""} select-none${bounce ? " animate-bounce-short" : ""}`}
      tabIndex={0}
      aria-label="Press the red button"
      onPointerDown={e => {
        // Only left mouse/touch/pen
        if (e.button !== undefined && e.button !== 0) return;
        setPointerDownPos({ x: e.clientX, y: e.clientY });
        // For mobile Safari, ensure focus
        (e.target as HTMLElement).focus?.();
      }}
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