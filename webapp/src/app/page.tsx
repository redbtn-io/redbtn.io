"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import cardsData from "../data/cards.json";
import CardWithCarousel from "./components/CardWithCarousel";
import ComingSoon from "./components/ComingSoon";
import Conversation from "./components/Conversation";
import RedButton from "./components/RedButton";
import TitleScreen from "./components/TitleScreen";
import cardIcons from "./utils/cardIcons";

function renderHTML(html: string) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

type CardPage = {
  titleParts: { text: string; className?: string }[];
  body: string[];
  links?: { link: string; label?: string; icon: string }[];
};

type CardData = {
  key: string;
  pages: CardPage[];
};

export default function Home() {
  const [minimized, setMinimized] = useState(false);
  const [doorsVisible, setDoorsVisible] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardPageIndexes, setCardPageIndexes] = useState<Record<string, number>>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [redBtnCorner, setRedBtnCorner] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right"
  >("bottom-right");
  const snapContainerRef = useRef<HTMLDivElement>(null);
  const cardCount = cardsData.length;

  // Subdomain detection
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonDescription, setComingSoonDescription] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const sub = host.split(".")[0];
      const descriptions: Record<string, string> = {
        meet: "redMeet is a fast, privacy-first calendar booking tool for teams and individuals. Share your link, let people book, and keep your schedule in sync — coming soon.",
        book: "redBook is a simple CRM for managing contacts, automating emails, and handling phone numbers. Stay in touch and automate your outreach — coming soon.",
        sign: "redSign is a secure, privacy-first e-signature platform for contracts and agreements. Sign documents with ease — coming soon.",
        note: "redNote is a block-based collaborative notes app. Organize ideas, meeting notes, and knowledge bases — coming soon.",
      };
      if (["meet", "book", "sign", "note"].includes(sub)) {
        setShowComingSoon(true);
        setComingSoonDescription(descriptions[sub]);
      }
    }
  }, []);

  // Title screen prompt delay
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

  // Door hide after animation
  useEffect(() => {
    if (minimized) {
      const timeout = setTimeout(() => setDoorsVisible(false), 700);
      return () => clearTimeout(timeout);
    } else {
      setDoorsVisible(true);
    }
  }, [minimized]);

  // Scroll restoration prevention
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Sync snap scroll position with cardIndex
  useEffect(() => {
    const container = snapContainerRef.current;
    if (!container || !minimized) return;
    const targetCard = container.children[cardIndex] as HTMLElement;
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [cardIndex, minimized]);

  // Track which card is visible via IntersectionObserver
  useEffect(() => {
    const container = snapContainerRef.current;
    if (!container || !minimized) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.cardIndex
            );
            if (!isNaN(idx)) {
              setCardIndex(idx);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    for (const child of Array.from(container.children)) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, [minimized]);

  // Carousel page navigation
  const handleNextPage = useCallback(
    (cardKey: string, pageCount: number) => {
      setCardPageIndexes((prev) => ({
        ...prev,
        [cardKey]: Math.min((prev[cardKey] || 0) + 1, pageCount - 1),
      }));
    },
    []
  );

  const handlePrevPage = useCallback((cardKey: string) => {
    setCardPageIndexes((prev) => ({
      ...prev,
      [cardKey]: Math.max((prev[cardKey] || 0) - 1, 0),
    }));
  }, []);

  const handleSetPage = useCallback((cardKey: string, page: number) => {
    setCardPageIndexes((prev) => ({
      ...prev,
      [cardKey]: page,
    }));
  }, []);

  if (showComingSoon) {
    return <ComingSoon description={comingSoonDescription} />;
  }

  return (
    <div className="relative h-screen bg-background overflow-hidden">
      {/* Title screen with doors */}
      <TitleScreen
        show={!minimized && showPrompt}
        doorsVisible={doorsVisible}
        minimized={minimized}
      />

      {/* Red button */}
      <RedButton
        minimized={minimized}
        setMinimized={setMinimized}
        onPress={() => {
          if (cardIndex < cardCount - 1) {
            setCardIndex(cardIndex + 1);
          } else {
            setCardIndex(0);
          }
        }}
        onDouble={() => setChatOpen(true)}
        onHold={() => setChatOpen(true)}
        bounce={cardsData[cardIndex]?.key === "red" || chatOpen}
        onCornerChange={setRedBtnCorner}
      />

      {/* Red chat stub */}
      <Conversation
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        corner={redBtnCorner}
      />

      {/* Snap scroll card container */}
      {minimized && (
        <div ref={snapContainerRef} className="snap-container">
          {cardsData.map((card: CardData, idx: number) => (
            <div
              key={card.key}
              className="snap-card"
              data-card-index={idx}
            >
              <div className="card-content w-full flex items-center justify-center px-4">
                <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl border border-zinc-200/60 dark:border-zinc-800/60">
                  <CardWithCarousel
                    card={card}
                    cardIcons={cardIcons}
                    renderHTML={renderHTML}
                    pageIndex={cardPageIndexes[card.key] || 0}
                    onNextPage={() =>
                      handleNextPage(card.key, card.pages.length)
                    }
                    onPrevPage={() => handlePrevPage(card.key)}
                    onSetPage={(page) => handleSetPage(card.key, page)}
                    isActive={idx === cardIndex}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card position indicator */}
      {minimized && !chatOpen && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          {cardsData.map((_: CardData, idx: number) => (
            <button
              key={idx}
              onClick={() => setCardIndex(idx)}
              className={`card-indicator rounded-full transition-all ${
                idx === cardIndex
                  ? "w-2.5 h-2.5 bg-red-600"
                  : "w-2 h-2 bg-zinc-400/50 dark:bg-zinc-600/50 hover:bg-zinc-400 dark:hover:bg-zinc-500"
              }`}
              aria-label={`Go to card ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll hint on first card */}
      {minimized && cardIndex === 0 && !chatOpen && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 animate-scroll-hint">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-zinc-400 dark:text-zinc-500"
          >
            <path
              d="M12 5v14m0 0l-6-6m6 6l6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
