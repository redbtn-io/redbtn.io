"use client";
import React, { useState } from "react";
import { sendContact } from "@/calls/contact";
import OverlayModal from "./OverlayModal";
import LoadingWheel from "./LoadingWheel";

type Props = { onBack: () => void };

export default function ContactForm({ onBack }: Props) {
  const [overlay, setOverlay] = useState<null | "loading" | "success" | "error">(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOverlay("loading");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      send: "redbtnio@gmail.com",
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
      source: "redbtn.io",
    };
    try {
      const res = await sendContact(payload);
      if (res.ok) {
        setOverlay("success");
        form.reset(); // Clear form fields
      } else {
        setOverlay("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setOverlay("error");
    }
  }

  function handleOverlayClose() {
    if (overlay === "success") {
      setOverlay(null);
      onBack(); // Hide the contact form after success
    } else {
      setOverlay(null);
    }
  }

  return (
    <>
      <form
        className="bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow-lg p-8 w-full max-w-2xl mx-auto border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-red-700">Contact Us</h2>
          <button
            type="button"
            onClick={onBack}
            className="text-zinc-500 hover:text-red-600 font-semibold px-3 py-1 rounded transition-colors border border-transparent hover:border-red-200 cursor-pointer"
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
          className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors select-none cursor-pointer"
        >
          Send Message
        </button>
      </form>
      <OverlayModal
        open={!!overlay}
        onClose={handleOverlayClose}
        closeable={overlay !== "loading"}
      >
        {overlay === "loading" && (
          <div className="flex flex-col items-center gap-2 py-6 px-4">
            <LoadingWheel size={48} color="#dc2626" />
            <span className="text-lg font-semibold mt-2">Sending your message...</span>
          </div>
        )}
        {overlay === "success" && (
          <div className="flex flex-col items-center gap-2 py-6 px-4">
            {checkmarkSVG}
            <span className="text-lg font-semibold">Thank you for reaching out!</span>
            <span className="text-zinc-500 text-sm">We’ll get back to you soon.</span>
            <button
              onClick={handleOverlayClose}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
        {overlay === "error" && (
          <div className="flex flex-col items-center gap-2 py-6 px-4">
            <span className="text-3xl text-red-600 mb-2">❌</span>
            <span className="text-lg font-semibold">Something went wrong.</span>
            <span className="text-zinc-500 text-sm">Please try again later.</span>
            <button
              onClick={handleOverlayClose}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </OverlayModal>
    </>
  );
}

{/* SVG for success checkmark */}
const checkmarkSVG = (
  <svg
    className="mb-2"
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="24" cy="24" r="24" fill="#dc2626" />
    <path
      d="M34 18L21.5 30.5L14 23"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);