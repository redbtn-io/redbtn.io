import React, { useRef, useEffect, useState } from "react";
import initialMessages from "../../data/messages.json"; // Import the messages

type Message = {
  id: number;
  sender: "user" | "ai";
  text: string;
};

type ConversationProps = {
  open: boolean;
  onClose: () => void;
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

export default function Conversation({ open, onClose, corner }: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((msg) => ({
      ...msg,
      sender: msg.sender === "user" ? "user" : "ai",
    }))
  );
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle mount/unmount for animation
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (open) {
      setVisible(true);
      setAnimateIn(false);
      // Wait for the modal to mount, then trigger the animation
      timeout = setTimeout(() => setAnimateIn(true), 10); // 10ms is enough
    } else {
      setAnimateIn(false);
      timeout = setTimeout(() => setVisible(false), 300); // match your duration
    }
    return () => clearTimeout(timeout);
  }, [open]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [
      ...msgs,
      { id: msgs.length + 1, sender: "user", text: input.trim() },
    ]);
    setInput("");
  };

  // Determine slide direction
  const slideFrom =
    corner === "top-left" || corner === "top-right"
      ? "-translate-y-[100vh]"
      : "translate-y-[100vh]";
  const slideTo = "translate-y-0";

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`
        fixed inset-0 bg-black/60
        transition-opacity duration-300
        ${animateIn ? "opacity-100 z-20" : "opacity-0 z-0"}
        
      `}
        style={{ transitionProperty: "opacity" }}
        aria-modal="true"
        role="dialog"
        onClick={onClose}
      >
      {/* Modal */}
      <div
        className={`
        fixed inset-0 flex items-center justify-center
        pointer-events-none
        transition-transform
        ${animateIn ? slideTo : slideFrom}
        duration-300 
      `}
      >
        <div
          className={`
          pointer-events-auto
          relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-6xl mx-4 flex flex-col h-[70vh]
        `}
          style={{ transitionProperty: "transform" }}
        >
          {/* Conversation */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[75%] text-base ${
                    msg.sender === "user"
                      ? "bg-red-600 text-white rounded-br-sm"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-zinc-900 rounded-b-xl"
          >
            <input
              type="text"
              className="flex-1 p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
              disabled={!input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
      </div>
      {/* Close button */}
    </>
  );
}