"use client";

type TitleScreenProps = {
  show: boolean;
  doorsVisible: boolean;
  minimized: boolean;
};

export default function TitleScreen({
  show,
  doorsVisible,
  minimized,
}: TitleScreenProps) {
  if (!show && !doorsVisible) return null;

  return (
    <>
      {/* Doors */}
      {doorsVisible && (
        <>
          <div
            className="door left-door"
            style={{
              transform: minimized ? "translateX(-100%)" : "translateX(0)",
            }}
          />
          <div
            className="door right-door"
            style={{
              transform: minimized ? "translateX(100%)" : "translateX(0)",
            }}
          />
        </>
      )}

      {/* "Press the red button" text */}
      {show && (
        <div className="fixed inset-0 z-[15] flex items-center justify-center">
          <div
            className="
              mb-86
              text-4xl sm:text-5xl
              font-extrabold uppercase tracking-widest
              text-center
              drop-shadow-lg
              select-none pointer-events-none
            "
          >
            <span className="inline-block text-zinc-900 dark:text-zinc-100 animate-fadein">
              press
            </span>
            <br />
            <span
              className="p-2 inline-block opacity-0 text-zinc-900 dark:text-zinc-100 animate-fadein"
              style={{ animationDelay: "1000ms" }}
            >
              the
            </span>
            <span
              className="p-2 inline-block opacity-0 text-red-600 animate-fadein"
              style={{ animationDelay: "1500ms" }}
            >
              red
            </span>
            <span
              className="p-2 inline-block opacity-0 text-red-600 animate-fadein"
              style={{ animationDelay: "2000ms" }}
            >
              button
            </span>
          </div>
        </div>
      )}
    </>
  );
}
