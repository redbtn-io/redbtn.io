"use client";
import React, { useState, useEffect, useRef, JSX } from "react";
import RedButton from "./components/RedButton";
import ContactForm from "./components/ContactForm";
import TitleScreen from "./components/TitleScreen";
import Content from "./components/Content";
import cardsData from "../data/cards.json";
import Image from "next/image";
import CardWithCarousel from "./components/CardWithCarousel";
import Conversation from "./components/Conversation";

// Helper to render HTML safely (for the span)
function renderHTML(html: string) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// Icon components
const cardIcons: Record<string, JSX.Element> = {
  generic: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8.5 15.5l7-7m-4.5 0h4.5v4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  next: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="1" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  previous: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="9" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  github: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"/>
    </svg>
  ),
  red: (
    <Image src="/red.png" alt="Red Icon" width={48} height={48} />
  ),
  rdi: (<>
    <Image src="/rdi.png" alt="RDI Icon" width={64} height={64} className="hidden dark:block" />
    <Image src="/rdi-light.png" alt="RDI Icon Light" width={64} height={64} className="dark:hidden" />
  </>
  ),
  bri: (
    <Image src="/bri.png" alt="Bri Nicole Icon" width={64} height={64} className="rounded-full" />
  ),
  eliteentries: (
    <Image src="/eliteentries.ico" alt="Elite Entries Icon" width={64} height={64} className="rounded-full" />
  ),
  peak:(
    <Image src="/peak.png" alt="Peak Icon" width={64} height={64} className="rounded-full" />
  ),
  ga:(
    <Image src="/ga.png" alt="GA Icon" width={64} height={64} className="rounded-full" />
  )
};



export default function Home() {
  const [minimized, setMinimized] = useState(false);
  const [doorsVisible, setDoorsVisible] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [cooldown, setCooldown] = useState(false); // <-- Add this line
  const [cardPageIndexes, setCardPageIndexes] = useState<Record<string, number>>({});
  const [chatBubble, setChatBubble] = useState(false);
  const [redBtnCorner, setRedBtnCorner] = useState<"top-left"|"top-right"|"bottom-left"|"bottom-right">("bottom-right");
  const [redBtnPos, setRedBtnPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);// Cards array now just passes card data

  const cards = cardsData.map((card: CardData) => ({
    key: card.key,
    content: (
      <CardWithCarousel
        card={card}
        cardIcons={cardIcons}
        renderHTML={renderHTML}
        pageIndex={cardPageIndexes[card.key] || 0}
        onNextPage={() => handleNextPage(card.key, card.pages.length)}
        onPrevPage={() => handlePrevPage(card.key)}
      />
    )
  }));

  const currentCardKey = cards[cardIndex]?.key;
  const cardCount = cards.length;

  const handleNextPage = (cardKey: string, pageCount: number) => {
    setCardPageIndexes((prev) => ({
      ...prev,
      [cardKey]: Math.min((prev[cardKey] || 0) + 1, pageCount - 1),
    }));
  };

  const handlePrevPage = (cardKey: string) => {
    setCardPageIndexes((prev) => ({
      ...prev,
      [cardKey]: Math.max((prev[cardKey] || 0) - 1, 0),
    }));
  };

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

  useEffect(() => {
    console.log(redBtnPos)
  }, [redBtnPos])

  // Prevent scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-background transition-colors duration-700 overflow-hidden">
      {/* TitleScreen now includes the doors */}
      <TitleScreen show={!minimized && showPrompt} doorsVisible={doorsVisible} minimized={minimized} />

      {/* RedButton */}
      <RedButton
        minimized={minimized}
        setMinimized={setMinimized}
        onPress={() => {
          //setShowContact((prev) => !prev);
          // Loop to first card if at the last card, otherwise go to next
          if (cardIndex < cardCount - 1) {
            setCardIndex(cardIndex + 1);
          } else {
            setCardIndex(0);
          }
        }}
        onDouble={() => {
          setChatBubble(true);
        }}
        onHold={() => {
          alert("Button held!"); // Placeholder for hold action
        }}
        bounce={currentCardKey === "red" || chatBubble}
        onCornerChange={setRedBtnCorner}
        onPositionChange={setRedBtnPos}
      />

      {/* ChatBubble */}

      <Conversation
        open={chatBubble}
        onClose={() => setChatBubble(false)}
        corner={redBtnCorner}
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
          {cards.map((card) => (
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

// Define types for card data
type CardPage = {
  titleParts: { text: string; className?: string }[];
  body: string[];
  links?: { link: string; label?: string; icon: string }[];
};

type CardData = {
  key: string;
  pages: CardPage[];
};
