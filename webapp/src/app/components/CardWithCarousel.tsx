import React, { useEffect, useRef, JSX } from "react";

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
            <div className="text-lg mb-8 text-zinc-700 dark:text-zinc-200 space-y-4">
              {page.body.map((line, i) => {
                // If last line, render links inline floated right
                if (i === page.body.length - 1 && page.links && page.links.length > 0) {
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <span>{renderHTML(line)}</span>
                      <span className="flex gap-2 ml-4">
                        {page.links.map((l, j) => (
                          <a
                            key={j}
                            href={l.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-[var(--primary)] dark:hover:text-zinc-100 transition-colors flex items-center"
                            aria-label={l.label || "Link"}
                          >
                            {cardIcons[l.icon]}
                          </a>
                        ))}
                      </span>
                    </div>
                  );
                }
                return (
                  <span key={i} className="block">
                    {renderHTML(line)}
                  </span>
                );
              })}
            </div>
            {/* Carousel navigation arrows */}
            <div className="flex justify-between items-center mt-2">
              <div>
                {pageIndex > 0 && (
                  <button
                    type="button"
                    onClick={onPrevPage}
                    className="text-zinc-400 hover:text-[var(--primary)] dark:hover:text-zinc-100 transition-colors flex items-center"
                    aria-label="Previous"
                  >
                    {cardIcons.previous}
                  </button>
                )}
              </div>
              <div>
                {pageIndex < pageCount - 1 && (
                  <button
                    type="button"
                    onClick={onNextPage}
                    className="text-zinc-400 hover:text-[var(--primary)] dark:hover:text-zinc-100 transition-colors flex items-center"
                    aria-label="Next"
                  >
                    {cardIcons.next}
                  </button>
                )}
              </div>
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
        ))}
      </div>
    </div>
  );
}