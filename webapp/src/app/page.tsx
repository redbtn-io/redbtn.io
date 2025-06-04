"use client";
import { useState, useEffect, useRef } from "react";
import RedButton from "./components/RedButton";
import ContactForm from "./components/ContactForm";
import TitleScreen from "./components/TitleScreen";
import Content from "./components/Content";
import cardsData from "../data/cards.json";

// Helper to render HTML safely (for the span)
function renderHTML(html: string) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// Icon components
const cardIcons: any = {
  main: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"/>
    </svg>
  ),
  link: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"/>
    </svg>
  ),
};

// New CardWithCarousel component
function CardWithCarousel({ card }: { card: any }) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = card.pages.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Horizontal swipe logic
  useEffect(() => {
    const ref = containerRef.current;
    if (!ref) return;

    let isTouching = false;

    const onTouchStart = (e: TouchEvent) => {
      isTouching = true;
      touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTouching || touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > 60 && pageIndex > 0) {
        setPageIndex(pageIndex - 1);
      } else if (deltaX < -60 && pageIndex < pageCount - 1) {
        setPageIndex(pageIndex + 1);
      }
      touchStartX.current = null;
      isTouching = false;
    };

    ref.addEventListener("touchstart", onTouchStart);
    ref.addEventListener("touchend", onTouchEnd);

    return () => {
      ref.removeEventListener("touchstart", onTouchStart);
      ref.removeEventListener("touchend", onTouchEnd);
    };
  }, [pageIndex, pageCount]);

  // Keyboard arrow navigation (optional)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && pageIndex > 0) {
        setPageIndex(pageIndex - 1);
      } else if (e.key === "ArrowRight" && pageIndex < pageCount - 1) {
        setPageIndex(pageIndex + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pageIndex, pageCount]);

  return (
    <div ref={containerRef} className="relative w-full min-h-[320px] overflow-hidden">
      {/* Content */}
      <div
        className="flex w-full min-w-0 transition-transform duration-500"
        style={{
          transform: `translateX(${-pageIndex * 100}%)`
        }}
      >
        {card.pages.map((page: any, idx: number) => (
          <div key={idx} className="w-full min-w-0 flex-shrink-0 px-2">
            <h1 className="text-4xl font-bold mb-4 drop-shadow">
              {page.titleParts.map((part: any, i: number) => (
                <span key={i} className={part.className}>{part.text}</span>
              ))}
            </h1>
            <p className="text-lg mb-8 text-zinc-700 dark:text-zinc-200 space-y-4">
              {page.body.map((line: string, i: number) => (
                <span key={i} className="block">
                  {renderHTML(line)}
                </span>
              ))}
            </p>
            {page.link && (
              <div className="flex justify-end mt-2">
                <a
                  href={page.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-[var(--primary)] dark:hover:text-zinc-100 transition-colors"
                  aria-label={page.linkLabel || "Link"}
                >
                  {cardIcons[card.key] || cardIcons.link}
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Carousel navigation dots */}
      {pageCount > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {card.pages.map((_: any, i: number) => (
            <button
              key={i}
              className={`w-3 h-3 rounded-full ${i === pageIndex ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-700"} transition-colors`}
              onClick={() => setPageIndex(i)}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Cards array now just passes card data
const cards = cardsData.map(card => ({
  key: card.key,
  content: <CardWithCarousel card={card} />
}));

export default function Home() {
  const [minimized, setMinimized] = useState(false);
  const [doorsVisible, setDoorsVisible] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cooldown, setCooldown] = useState(false); // <-- Add this line
  const cardCount = cards.length;
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (!minimized) {
      timeout = setTimeout(() => setShowPrompt(true), 3000);
    } else {
      setShowPrompt(false);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [minimized]);

  useEffect(() => {
    if (minimized) {
      const timeout = setTimeout(() => setDoorsVisible(false), 700); // match transition duration
      return () => clearTimeout(timeout);
    } else {
      setDoorsVisible(true);
      setShowContact(false); // Reset contact form when maximizing
    }
  }, [minimized]);

  // Snap scroll logic
  useEffect(() => {
    const ref = cardContainerRef.current;
    if (!ref) return;

    let isTouching = false;

    const onTouchStart = (e: TouchEvent) => {
      isTouching = true;
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isTouching || touchStartY.current === null || cooldown) return;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (deltaY > 60 && cardIndex > 0) {
        setCardIndex(cardIndex - 1);
        setCooldown(true);
        setTimeout(() => setCooldown(false), 500); // 500ms cooldown
      } else if (deltaY < -60 && cardIndex < cardCount - 1) {
        setCardIndex(cardIndex + 1);
        setCooldown(true);
        setTimeout(() => setCooldown(false), 500);
      }
      touchStartY.current = null;
      isTouching = false;
    };

    ref.addEventListener("touchstart", onTouchStart);
    ref.addEventListener("touchend", onTouchEnd);

    return () => {
      ref.removeEventListener("touchstart", onTouchStart);
      ref.removeEventListener("touchend", onTouchEnd);
    };
  }, [cardIndex, cardCount, cooldown]);

  // Mouse wheel snap (for desktop)
  useEffect(() => {
    const ref = cardContainerRef.current;
    if (!ref) return;

    let lastWheel = 0;
    const onWheel = (e: WheelEvent) => {
      if (cooldown) return;
      if (Math.abs(e.deltaY) < 40) return;
      if (Date.now() - lastWheel < 600) return;
      lastWheel = Date.now();
      if (e.deltaY > 0 && cardIndex < cardCount - 1) {
        setCardIndex(cardIndex + 1);
        setCooldown(true);
        setTimeout(() => setCooldown(false), 500);
      } else if (e.deltaY < 0 && cardIndex > 0) {
        setCardIndex(cardIndex - 1);
        setCooldown(true);
        setTimeout(() => setCooldown(false), 500);
      }
    };
    ref.addEventListener("wheel", onWheel, { passive: false });
    return () => ref.removeEventListener("wheel", onWheel);
  }, [cardIndex, cardCount, cooldown]);

  return (
    <div className="relative min-h-screen bg-background transition-colors duration-700 overflow-hidden">
      {/* TitleScreen now includes the doors */}
      <TitleScreen show={!minimized && showPrompt} doorsVisible={doorsVisible} minimized={minimized} />

      {/* RedButton */}
      <RedButton
        minimized={minimized}
        setMinimized={setMinimized}
        onPress={() => {
          setShowContact((prev) => !prev);
        }}
        onDouble={() => {
          console.log("Button double-clicked!"); // Placeholder for double-click action
          setMinimized(false);
        }}
        onHold={() => {
          console.log("Button held!"); // Placeholder for hold action
          setMinimized(false);
        }}
      />

      {/* Card carousel */}
      <div
        ref={cardContainerRef}
        className="main-content flex flex-col items-center justify-center min-h-screen absolute inset-0 transition-all duration-700"
        style={{
          touchAction: "pan-y",
          overflow: "hidden",
        }}
      >
        <div
          className="w-full flex flex-col items-center transition-transform duration-500"
          style={{
            transform: `translateY(${-cardIndex * 100}vh)`,
            willChange: "transform",
          }}
        >
          {cards.map((card, idx) => (
            <div key={card.key} className="flex items-center justify-center min-h-screen w-full">
              <Content
                onUserScroll={() => {
                  setCooldown(true);
                  setTimeout(() => setCooldown(false), 500); // 500ms or adjust as needed
                }}
              >
                {card.content}
              </Content>
            </div>
          ))}
        </div>
      </div>

      {/* Contact form */}
      <div
        className={`
          contact-content flex flex-col items-center justify-center min-h-screen absolute inset-0 transition-all duration-700
          ${showContact ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-8 pointer-events-none"}
        `}
      >
        <ContactForm onBack={() => setShowContact(false)} />
      </div>
    </div>
  );
}