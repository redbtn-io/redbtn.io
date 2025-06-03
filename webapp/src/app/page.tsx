"use client";
import { useState, useEffect } from "react";
import RedButton from "./RedButton";

export default function Home() {
  const [minimized, setMinimized] = useState(false);
  const [doorsVisible, setDoorsVisible] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false); // NEW

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (!minimized) {
      timeout = setTimeout(() => setShowPrompt(true), 5000);
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
      {/* Door effect */}
      {doorsVisible && (
        <>
          <div
            className="door left-door"
            style={{ transform: minimized ? "translateX(-100%)" : "translateX(0)" }}
          />
          <div
            className="door right-door"
            style={{ transform: minimized ? "translateX(100%)" : "translateX(0)" }}
          />
        </>
      )}
      {/* Centered RedButton & title */}
      {!minimized && showPrompt && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
          <div className="
            mb-84
            text-4xl
            sm:text-5xl
            font-extrabold
            uppercase
            tracking-widest
            text-center
            text-red-700
            drop-shadow-lg
            animate-fadein
            select-none
            pointer-events-none
          ">
            press<br />the red button
          </div>
        </div>
      )}

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

function MainContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <div className="bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow-xl p-10 w-full max-w-2xl mb-8 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-4xl font-bold mb-4 text-red-700 drop-shadow">Welcome to redbtn.io</h1>
        <p className="text-lg mb-8 text-zinc-700 dark:text-zinc-200"><br/>
          Digital consulting & development for businesses, creators, and dreamers. <br /><br />
          Web, native, APIs, automation, SEO, marketing, and more.<br /><br />
          <span className="font-semibold text-red-600">Hit the red button to turn ideas into action. 

          </span>
        </p>
        {/* Add more content here */}
      </div>
    </div>
  );
}

function ContactForm({ onBack }: { onBack: () => void }) {
  return (
    <form
      className="bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow-lg p-8 w-full max-w-2xl mx-auto border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4"
      onSubmit={e => {
        e.preventDefault();
        // TODO: handle form submission
        alert("Thank you for reaching out!");
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-red-700">Contact Us</h2>
        <button
          type="button"
          onClick={onBack}
          className="text-zinc-500 hover:text-red-600 font-semibold px-3 py-1 rounded transition-colors border border-transparent hover:border-red-200"
        >
          Back
        </button>
      </div>
      <input
        type="text"
        name="name"
        placeholder="Your Name"
        required
        className="p-3 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      <input
        type="email"
        name="email"
        placeholder="Your Email"
        required
        className="p-3 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      <textarea
        name="message"
        placeholder="Your Message"
        required
        rows={4}
        className="p-3 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      <button
        type="submit"
        className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors"
      >
        Send Message
      </button>
    </form>
  );
}
// Note: The RedButton component is imported from another file and handles its own logic