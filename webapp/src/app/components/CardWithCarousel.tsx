import React, { useState, useEffect, useRef, JSX } from "react";

export type CardPage = {
  titleParts: { text: string; className?: string }[];
  body: string[];
  links?: { link: string; label?: string; icon: string }[];
};

export type CardData = {
  key: string;
  pages: CardPage[];
};

type CardWithCarouselProps = {
  card: CardData;
  cardIcons: Record<string, JSX.Element>;
  renderHTML: (html: string) => JSX.Element;
  pageIndex: number;
  onNextPage: () => void;
  onPrevPage: () => void;
};

export default function CardWithCarousel({
  card,
  cardIcons,
  renderHTML,
  pageIndex,
  onNextPage,
  onPrevPage,
}: CardWithCarouselProps) {
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
        onPrevPage();
      } else if (deltaX < -60 && pageIndex < pageCount - 1) {
        onNextPage();
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
  }, [pageIndex, pageCount, onNextPage, onPrevPage]);

  // Keyboard arrow navigation (optional)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && pageIndex > 0) {
        onPrevPage();
      } else if (e.key === "ArrowRight" && pageIndex < pageCount - 1) {
        onNextPage();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pageIndex, pageCount, onNextPage, onPrevPage]);

  return (
    <div ref={containerRef} className="relative w-full min-h-[320px] overflow-hidden">
      {/* Content */}
      <div
        className="flex w-full min-w-0 transition-transform duration-500"
        style={{
          transform: `translateX(${-pageIndex * 100}%)`
        }}
      >
        {card.pages.map((page, idx) => (
          <div key={idx} className="w-full min-w-0 flex-shrink-0 px-2">
            <h1 className="text-4xl font-bold mb-4 drop-shadow">
              {page.titleParts.map((part, i) => (
                <span key={i} className={part.className}>{part.text}</span>
              ))}
            </h1>
            <p className="text-lg mb-8 text-zinc-700 dark:text-zinc-200 space-y-4">
              {page.body.map((line, i) => (
                <span key={i} className="block">
                  {renderHTML(line)}
                </span>
              ))}
            </p>
            {page.links && page.links.length > 0 && (
              <div className="flex justify-end mt-2 gap-2">
                {page.links.map((l, i) =>
                  l.icon === "next" ? (
                    <button
                      key={i}
                      type="button"
                      onClick={onNextPage}
                      className="text-zinc-400 hover:text-[var(--primary)] dark:hover:text-zinc-100 transition-colors flex items-center"
                      aria-label={l.label || "Next"}
                    >
                      {cardIcons.next}
                    </button>
                  ) : l.icon === "previous" ? (
                    <button
                      key={i}
                      type="button"
                      onClick={onPrevPage}
                      className="text-zinc-400 hover:text-[var(--primary)] dark:hover:text-zinc-100 transition-colors flex items-center"
                      aria-label={l.label || "Previous"}
                    >
                      {cardIcons.previous}
                    </button>
                  ) : (
                    <a
                      key={i}
                      href={l.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-[var(--primary)] dark:hover:text-zinc-100 transition-colors flex items-center"
                      aria-label={l.label || "Link"}
                    >
                      {cardIcons[l.icon]}
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Carousel navigation dots */}
      {pageCount > 1 && (
        <div className="mt-2 bottom-4 left-0 right-0 flex justify-center gap-2">
          {card.pages.map((_, i) => (
            <button
              key={i}
              className={`w-3 h-3 rounded-full ${i === pageIndex ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-700"} transition-colors`}
              onClick={() => i > pageIndex ? onNextPage() : onPrevPage()}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}