"use client";
export default function MainContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh]">
      <div className="bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow-xl p-10 w-full max-w-2xl mb-8 border border-zinc-200 dark:border-zinc-800">
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
      </div>
    </div>
  );
}