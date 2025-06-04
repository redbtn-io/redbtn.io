"use client";
import { useState, useEffect } from "react";
import RedButton from "./components/RedButton";
import MainContent from "./components/MainContent";
import ContactForm from "./components/ContactForm";
import TitleScreen from "./components/TitleScreen";

export default function Home() {
  const [minimized, setMinimized] = useState(false);
  const [doorsVisible, setDoorsVisible] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false); // NEW

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

      {/* Main site content */}
      <div
        className={`
          main-content flex flex-col items-center justify-center min-h-screen absolute inset-0 transition-all duration-700
          ${minimized && !showContact ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-8 pointer-events-none"}
        `}
      >
        <MainContent />
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