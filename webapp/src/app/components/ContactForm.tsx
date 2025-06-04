"use client";
type Props = { onBack: () => void };
export default function ContactForm({ onBack }: Props) {
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