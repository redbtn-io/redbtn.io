"use client";
export default function MainContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <div className="relative bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow-xl p-10 w-full max-w-2xl mb-8 border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-4xl font-bold mb-4 drop-shadow">
          <span className="text-zinc-900 dark:text-zinc-100 lowercase">find your </span>
          <span className="text-red-700 lowercase">red button</span>
        </h1>
        <p className="text-lg mb-8 text-zinc-700 dark:text-zinc-200"><br/>
          Digital consulting & development for businesses, creators, and dreamers. <br /><br />
          Web, native, APIs, automation, SEO, marketing, and more.<br /><br />
          <span className="font-semibold text-red-600">Hit the red button to turn ideas into action. 
          </span>
        </p>
        {/* Add more content here */}
        {/* GitHub icon bottom right */}
        <a
          href="https://github.com/redbtn-io"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 text-zinc-400 hover:text-[var(--primary)] dark:hover:text-zinc-100 transition-colors"
          aria-label="GitHub"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}