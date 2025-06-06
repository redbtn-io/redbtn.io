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
import cardIcons from "./utils/cardIcons";

// Helper to render HTML safely (for the span)
function renderHTML(html: string) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

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
