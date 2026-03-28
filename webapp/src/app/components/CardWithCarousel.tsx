import React, { useEffect, useRef, useState, JSX } from "react";
import { sendContact } from "@/calls/contact";

export type CardPage = {
  titleParts: { text: string; className?: string }[];
  body: string[];
  links?: { link: string; label?: string; icon: string }[];
  contactForm?: boolean;
  smallText?: boolean;
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

            {/* Body — contact form or regular content */}
            {page.contactForm ? (
              <div>
                {page.body.length > 0 && (
                  <div className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed mb-4">
                    {page.body.map((line, i) => (
                      <span key={i} className="block">{renderHTML(line)}</span>
                    ))}
                  </div>
                )}
                <InlineContactForm onSeeWork={pageCount > 1 ? onNextPage : undefined} />
              </div>
            ) : (
            <div className={`${page.smallText ? "text-sm sm:text-base space-y-1.5" : "text-base sm:text-lg space-y-3"} text-zinc-600 dark:text-zinc-300 leading-relaxed`}>
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
            )}
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
          <div className="flex gap-0">
            {card.pages.map((_, i) => (
              <button
                key={i}
                type="button"
                className="p-2 flex items-center justify-center"
                onClick={() => onSetPage(i)}
                aria-label={`Page ${i + 1} of ${pageCount}`}
              >
                <span
                  className={`block rounded-full transition-all ${
                    i === pageIndex
                      ? "w-3 h-3 bg-red-600"
                      : "w-2.5 h-2.5 bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500"
                  }`}
                />
              </button>
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

function InlineContactForm({ onSeeWork }: { onSeeWork?: () => void }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await sendContact({
        send: "george@redbtn.io",
        from: "noreply@redbtn.io",
        name: fd.get("name"),
        email: fd.get("email"),
        message: fd.get("message"),
        source: "redbtn.io",
      });
      if (res.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10l3.5 3.5L15 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">Message sent. We&apos;ll be in touch.</p>
        <button onClick={() => setStatus("idle")} className="text-xs text-red-600 hover:underline mt-1">Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="contact-name" className="sr-only">Name</label>
      <input
        id="contact-name"
        type="text"
        name="name"
        placeholder="Name"
        required
        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
      />
      <label htmlFor="contact-email" className="sr-only">Email</label>
      <input
        id="contact-email"
        type="email"
        name="email"
        placeholder="Email"
        required
        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
      />
      <label htmlFor="contact-message" className="sr-only">Message</label>
      <textarea
        id="contact-message"
        name="message"
        placeholder="Message"
        required
        rows={3}
        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 resize-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : status === "error" ? "Try again" : "Send message"}
      </button>
      {onSeeWork && (
        <button
          type="button"
          onClick={onSeeWork}
          className="text-xs text-zinc-400 hover:text-red-600 transition-colors mt-2 flex items-center gap-1 self-center"
        >
          See the work <span className="text-sm">→</span>
        </button>
      )}
    </form>
  );
}
