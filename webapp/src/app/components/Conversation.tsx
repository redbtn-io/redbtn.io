import React, { useRef, useEffect, useState } from "react";

type Message = {
  id: number;
  sender: "user" | "red";
  text: string;
};

type ConversationProps = {
  open: boolean;
  onClose: () => void;
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    sender: "red",
    text: "Hey! I'm Red. I'm your AI assistant that lives across every redbtn app. I can help you build automations, deploy apps, create documents, manage your fleet, and more.",
  },
  {
    id: 2,
    sender: "red",
    text: "This is just a preview. The full Red experience is coming soon with the @redbtn/red component. For now, feel free to type something and I'll echo it back.",
  },
];

export default function Conversation({
  open,
  onClose,
  corner,
}: ConversationProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle mount/unmount animation
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (open) {
      setVisible(true);
      setAnimateIn(false);
      timeout = setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
      timeout = setTimeout(() => setVisible(false), 300);
    }
    return () => clearTimeout(timeout);
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Escape key closes chat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: messages.length + 1,
      sender: "user",
      text: input.trim(),
    };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");

    // Stub response after a short delay
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          id: msgs.length + 1,
          sender: "red",
          text: `I heard you say: "${userMsg.text}". The full Red AI is being built as @redbtn/red and will connect to the redbtn graph engine. Stay tuned!`,
        },
      ]);
    }, 800);
  };

  // Position based on which corner the button is in
  const isTop = corner === "top-left" || corner === "top-right";
  const slideFrom = isTop
    ? "-translate-y-[100vh]"
    : "translate-y-[100vh]";

  if (!visible) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? "opacity-100 z-20" : "opacity-0 z-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Chat modal */}
      <div
        className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300 ${
          animateIn ? "translate-y-0 z-30" : `${slideFrom} z-0`
        }`}
      >
        <div
          className="pointer-events-auto relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col h-[70vh] max-h-[600px] border border-zinc-200/60 dark:border-zinc-800/60"
          role="dialog"
          aria-modal="true"
          aria-label="Chat with Red"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
              <span className="font-semibold text-sm">
                <span className="text-red-600">Red</span>
                <span className="text-zinc-400 dark:text-zinc-500 ml-2 font-normal text-xs">
                  preview
                </span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-xl leading-none"
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-red-600 text-white rounded-br-md"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md"
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
            className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3"
          >
            <input
              type="text"
              className="flex-1 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
              placeholder="Talk to Red..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus={open}
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors text-sm disabled:opacity-40"
              disabled={!input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
