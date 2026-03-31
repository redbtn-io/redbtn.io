"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

function getNearestCorner(
  x: number,
  y: number,
  width: number,
  height: number
): Corner {
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
  cornerDance = false,
}: {
  onPress: () => void;
  minimized: boolean;
  setMinimized: (v: boolean) => void;
  onDouble?: () => void;
  onHold?: () => void;
  bounce?: boolean;
  onCornerChange?: (corner: Corner) => void;
  /** When true, Red jumps to all 4 corners before returning home */
  cornerDance?: boolean;
}) {
  const [corner, setCorner] = useState<Corner>("bottom-right");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [justDropped, setJustDropped] = useState<
    { x: number; y: number } | false
  >(false);
  const [pointerDownPos, setPointerDownPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const holdTimeout = useRef<NodeJS.Timeout | null>(null);
  const holdFired = useRef(false);
  const btnRef = useRef<HTMLDivElement>(null);

  // Drag logic
  useEffect(() => {
    if (!pointerDownPos) return;

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
      let x = 0,
        y = 0;
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

      let x = 0,
        y = 0;
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
          const nearest = getNearestCorner(
            x,
            y,
            window.innerWidth,
            window.innerHeight
          );
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

    const holdTimeoutCurrent = holdTimeout.current;

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      if (holdTimeoutCurrent) clearTimeout(holdTimeoutCurrent);
    };
  }, [pointerDownPos, dragging, minimized, onHold]);

  // Cancel hold on large movement
  useEffect(() => {
    if (!pointerDownPos) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      let x = 0,
        y = 0;
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

  // Tap / double-tap / hold detection
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const localPointerDownPos = { current: null as { x: number; y: number } | null };
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
      localPointerDownPos.current = { x: e.clientX, y: e.clientY };
      doubleTapLock.current = false;

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
      const dist = localPointerDownPos.current
        ? Math.hypot(
            x - localPointerDownPos.current.x,
            y - localPointerDownPos.current.y
          )
        : 0;

      if (dist < 8 && !holdFired.current) {
        const now = Date.now();
        if (minimized && onDouble) {
          if (
            lastTapTime.current &&
            now - lastTapTime.current < 350 &&
            !doubleTapLock.current
          ) {
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
      localPointerDownPos.current = null;
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

  // Notify parent of corner changes
  useEffect(() => {
    if (onCornerChange) onCornerChange(corner);
  }, [corner, onCornerChange]);

  // Corner dance: jump to all corners then return home
  const dancingRef = useRef(false);
  useEffect(() => {
    if (!cornerDance || !minimized || dancingRef.current) return;
    dancingRef.current = true;

    const home = corner;
    const others: Corner[] = (
      ["top-left", "top-right", "bottom-left", "bottom-right"] as Corner[]
    ).filter((c) => c !== home);

    // Shuffle for variety, then append home at the end
    const sequence = [...others, home];
    let i = 0;

    const step = () => {
      if (i < sequence.length) {
        setCorner(sequence[i]);
        i++;
        setTimeout(step, 175);
      } else {
        dancingRef.current = false;
      }
    };

    setTimeout(step, 100);
  }, [cornerDance, minimized, corner]);

  // Compute container bounds (respects max-width constraint)
  const getContainerBounds = () => {
    if (typeof window === "undefined") return { left: 0, right: 1024, width: 1024 };
    const maxW = 1024;
    const vw = window.innerWidth;
    const containerWidth = Math.min(vw, maxW);
    const containerLeft = (vw - containerWidth) / 2;
    return { left: containerLeft, right: containerLeft + containerWidth, width: containerWidth };
  };

  // Compute style
  const btnSize = minimized ? 80 : 180;
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: minimized ? 20 : 15,
    pointerEvents: dragging ? "none" : "auto",
    width: btnSize,
    height: btnSize,
    transition:
      "left 0.5s cubic-bezier(.4,2,.6,1), top 0.5s cubic-bezier(.4,2,.6,1), width 0.4s ease, height 0.4s ease",
  };

  if (dragging && dragPos && minimized) {
    style.left = dragPos.x - 40;
    style.top = dragPos.y - 40;
    style.transition = "none";
  } else if (
    justDropped &&
    minimized &&
    typeof justDropped === "object"
  ) {
    style.left = justDropped.x - 40;
    style.top = justDropped.y - 40;
    style.transition = "none";
  } else if (minimized) {
    const isMd =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    const margin = isMd ? 24 : 12;
    const bounds = getContainerBounds();
    switch (corner) {
      case "top-left":
        style.left = bounds.left + margin;
        style.top = margin * 3;
        break;
      case "top-right":
        style.left = bounds.right - margin - btnSize;
        style.top = margin * 3;
        break;
      case "bottom-left":
        style.left = bounds.left + margin;
        style.top = window.innerHeight - margin - btnSize;
        break;
      case "bottom-right":
        style.left = bounds.right - margin - btnSize;
        style.top = window.innerHeight - margin - btnSize;
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
      className={`redbtn-shadow cursor-pointer select-none ${
        dragging ? "dragging" : ""
      }${bounce ? " animate-bounce-short" : ""}`}
      tabIndex={0}
      aria-label="Red button"
      onPointerDown={(e) => {
        if (e.button !== undefined && e.button !== 0) return;
        setPointerDownPos({ x: e.clientX, y: e.clientY });
        (e.target as HTMLElement).focus?.();
      }}
    >
      <div className="relative flex items-center justify-center select-none">
        <Image
          src="/red.png"
          alt="Red Button"
          width={minimized ? 80 : 180}
          height={minimized ? 80 : 180}
          className={`rounded-full select-none pointer-events-none transition-opacity duration-300 ${imgLoaded ? "opacity-100 redbtn-pulse" : "opacity-0"}`}
          draggable={false}
          priority
          onLoad={() => setImgLoaded(true)}
        />
      </div>
    </div>
  );
}
