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
  onSetPage: (page: number) => void;
  isActive: boolean;
};

export default function CardWithCarousel({
  card,
  cardIcons,
  renderHTML,
  pageIndex,
  onNextPage,
  onPrevPage,
  onSetPage,
  isActive,
}: CardWithCarouselProps) {
  const pageCount = card.pages.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Horizontal swipe for carousel pages
  useEffect(() => {
    const ref = containerRef.current;
    if (!ref || pageCount <= 1) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      if (deltaX > 60 && pageIndex > 0) {
        onPrevPage();
      } else if (deltaX < -60 && pageIndex < pageCount - 1) {
        onNextPage();
      }
      touchStartX.current = null;
    };

    ref.addEventListener("touchstart", onTouchStart, { passive: true });
    ref.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      ref.removeEventListener("touchstart", onTouchStart);
      ref.removeEventListener("touchend", onTouchEnd);
    };
  }, [pageIndex, pageCount, onNextPage, onPrevPage]);

  // Keyboard navigation scoped to the active card only
  useEffect(() => {
    if (!isActive || pageCount <= 1) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && pageIndex > 0) {
        onPrevPage();
      } else if (e.key === "ArrowRight" && pageIndex < pageCount - 1) {
        onNextPage();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, pageIndex, pageCount, onNextPage, onPrevPage]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* Carousel track */}
      <div
        className="carousel-track"
        style={{
          transform: `translateX(${-pageIndex * 100}%)`,
        }}
      >
        {card.pages.map((page, idx) => (
          <div
            key={idx}
            className="w-full flex-shrink-0 min-w-full"
          >
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl font-bold mb-5 leading-tight">
              {page.titleParts.map((part, i) => (
                <span key={i} className={part.className}>
                  {part.text}
                </span>
              ))}
            </h2>

            {/* Body */}
            <div className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 space-y-3 leading-relaxed">
              {page.body.map((line, i) => {
                // Last line with links: render inline
                if (
                  i === page.body.length - 1 &&
                  page.links &&
                  page.links.length > 0
                ) {
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-4 pt-1"
                    >
                      <span>{renderHTML(line)}</span>
                      <span className="flex gap-3 flex-shrink-0">
                        {page.links.map((l, j) => (
                          <a
                            key={j}
                            href={l.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-red-600 dark:hover:text-zinc-100 transition-colors"
                            aria-label={l.label || "Link"}
                          >
                            {cardIcons[l.icon] || cardIcons.external}
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
          </div>
        ))}
      </div>

      {/* Carousel controls (multi-page cards only) */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-700/50">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={pageIndex === 0}
            className={`transition-colors ${
              pageIndex === 0
                ? "text-zinc-300 dark:text-zinc-700 cursor-default"
                : "text-zinc-400 hover:text-red-600 dark:hover:text-zinc-100"
            }`}
            aria-label="Previous page"
          >
            {cardIcons.previous}
          </button>

          {/* Page dots */}
          <div className="flex gap-2">
            {card.pages.map((_, i) => (
              <button
                key={i}
                className={`rounded-full transition-all ${
                  i === pageIndex
                    ? "w-3 h-3 bg-red-600"
                    : "w-2.5 h-2.5 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500"
                }`}
                onClick={() => onSetPage(i)}
                aria-label={`Page ${i + 1} of ${pageCount}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNextPage}
            disabled={pageIndex === pageCount - 1}
            className={`transition-colors ${
              pageIndex === pageCount - 1
                ? "text-zinc-300 dark:text-zinc-700 cursor-default"
                : "text-zinc-400 hover:text-red-600 dark:hover:text-zinc-100"
            }`}
            aria-label="Next page"
          >
            {cardIcons.next}
          </button>
        </div>
      )}
    </div>
  );
}
