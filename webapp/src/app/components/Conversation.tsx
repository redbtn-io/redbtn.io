import React, { useRef, useEffect, useState, useCallback } from "react";
import { useRed, type Message } from "@redbtn/red";

type ConversationProps = {
  open: boolean;
  onClose: () => void;
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

// Uses the local /api/chat proxy (server-side auth, no secrets in frontend)
const API_URL = "";
const GRAPH_ID = process.env.NEXT_PUBLIC_RED_GRAPH_ID || "red-assistant";
const STORAGE_KEY = "red-conversation";

function loadConversation(): { conversationId?: string; messages?: Message[] } {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveConversation(conversationId: string | undefined, messages: Message[]) {
  if (typeof window === "undefined") return;
  try {
    // Only persist completed messages (not streaming)
    const completed = messages.filter((m) => !m.isStreaming);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ conversationId, messages: completed }));
  } catch {
    // localStorage full or unavailable
  }
}

export default function Conversation({
  open,
  onClose,
  corner,
}: ConversationProps) {
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const saved = useRef(loadConversation());

  const { messages, isStreaming, conversationId, display, send, clear } = useRed({
    config: {
      apiUrl: API_URL,
      chatEndpoint: "/api/chat",
      graphId: GRAPH_ID,
      source: "redbtn.io",
      conversationId: saved.current.conversationId,
    },
    display: {
      showTools: false,
      showThinking: false,
      showLoading: true,
      showClear: true,
    },
    systemPrompt:
      "You are Red, the universal AI assistant for redbtn. You are currently on the redbtn.io landing page. Be friendly, concise, and helpful. You can explain what redbtn does, describe the product suite (redRun, redFleet, redDoc, redNote, redMeet, redSign, redBook, redAct), and help visitors understand the platform.",
    initialMessages: saved.current.messages,
  });

  // Persist conversation to localStorage
  useEffect(() => {
    if (messages.length > 0 && !isStreaming) {
      saveConversation(conversationId, messages);
    }
  }, [messages, isStreaming, conversationId]);

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

  // Focus input when opened
  useEffect(() => {
    if (open && animateIn) {
      // Small delay to ensure DOM is ready after animation starts
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [open, animateIn]);

  // Escape key closes chat
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isStreaming) return;
      send(input.trim());
      setInput("");
    },
    [input, isStreaming, send]
  );

  // Position based on which corner the button is in
  const isTop = corner === "top-left" || corner === "top-right";
  const slideFrom = isTop ? "-translate-y-[100vh]" : "translate-y-[100vh]";

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
          className="pointer-events-auto relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg mx-4 flex flex-col h-[65vh] max-h-[560px] border border-zinc-200/40 dark:border-zinc-800/40 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Chat with Red"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full bg-red-600 ${isStreaming ? "animate-pulse" : ""}`}
              />
              <span className="font-semibold text-sm tracking-tight">
                <span className="text-red-600">Red</span>
                {isStreaming && (
                  <span className="text-zinc-400 dark:text-zinc-500 ml-1.5 font-normal text-xs">
                    thinking...
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {display.showClear && messages.length > 0 && (
                <button
                  onClick={() => {
                    clear();
                    localStorage.removeItem(STORAGE_KEY);
                  }}
                  className="text-zinc-400 hover:text-red-600 transition-colors text-[11px] px-2 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/50 hover:border-red-600/30"
                  aria-label="Clear conversation"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close chat"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 scroll-smooth">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                <div className="w-10 h-10 rounded-full bg-red-600 shadow-lg shadow-red-600/20" />
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    Hi, I&apos;m <span className="text-red-600">Red</span>
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    Ask me anything about redbtn
                  </p>
                </div>
              </div>
            )}
            {messages.map((msg: Message) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex flex-col gap-1 max-w-[85%]">
                  <div
                    className={`px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-red-600 text-white rounded-2xl rounded-br-sm"
                        : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    {msg.content ||
                      (msg.isStreaming ? (
                        <span className="inline-flex items-center gap-1.5 py-0.5">
                          <svg className="animate-spin h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </span>
                      ) : null)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 px-4 py-3"
          >
            <div className="flex-1 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-full border border-zinc-200/60 dark:border-zinc-700/40 px-4 py-2 focus-within:ring-2 focus-within:ring-red-500/30 focus-within:border-red-500/50 transition-all">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                placeholder="Talk to Red..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isStreaming}
                autoFocus
              />
              <button
                type="submit"
                className="text-red-600 hover:text-red-700 disabled:text-zinc-300 dark:disabled:text-zinc-600 transition-colors flex-shrink-0"
                disabled={!input.trim() || isStreaming}
                aria-label="Send"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M15.5 2.5L8 10M15.5 2.5L10.5 15.5L8 10M15.5 2.5L2.5 7.5L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
