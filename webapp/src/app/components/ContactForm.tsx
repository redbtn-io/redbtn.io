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
      send: "george@redbtn.io",
      from: "noreply@redbtn.io",
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
        className="bg-bg-elevated/80 rounded-xl shadow-lg p-8 w-full max-w-2xl mx-auto border border-border flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-accent-hover">Contact Us</h2>
          <button
            type="button"
            onClick={onBack}
            className="text-text-muted hover:text-accent font-semibold px-3 py-1 rounded transition-colors border border-transparent hover:border-accent-muted cursor-pointer"
          >
            Back
          </button>
        </div>
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          required
          className="p-3 rounded border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          required
          className="p-3 rounded border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <textarea
          name="message"
          placeholder="Your Message"
          required
          rows={4}
          className="p-3 rounded border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          className="mt-2 bg-accent hover:bg-accent-hover text-accent-foreground font-bold py-2 px-6 rounded transition-colors select-none cursor-pointer"
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
            <LoadingWheel size={48} color="var(--accent)" />
            <span className="text-lg font-semibold mt-2">Sending your message...</span>
          </div>
        )}
        {overlay === "success" && (
          <div className="flex flex-col items-center gap-2 py-6 px-4">
            {checkmarkSVG}
            <span className="text-lg font-semibold">Thank you for reaching out!</span>
            <span className="text-text-muted text-sm">We’ll get back to you soon.</span>
            <button
              onClick={handleOverlayClose}
              className="mt-4 bg-accent hover:bg-accent-hover text-accent-foreground font-bold py-2 px-6 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
        {overlay === "error" && (
          <div className="flex flex-col items-center gap-2 py-6 px-4">
            <span className="text-3xl text-accent mb-2">❌</span>
            <span className="text-lg font-semibold">Something went wrong.</span>
            <span className="text-text-muted text-sm">Please try again later.</span>
            <button
              onClick={handleOverlayClose}
              className="mt-4 bg-accent hover:bg-accent-hover text-accent-foreground font-bold py-2 px-6 rounded transition-colors cursor-pointer"
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
    <circle cx="24" cy="24" r="24" fill="var(--accent)" />
    <path
      d="M34 18L21.5 30.5L14 23"
      stroke="var(--accent-foreground)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
