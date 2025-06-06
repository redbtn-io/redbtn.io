import React, { JSX } from "react";
import Image from "next/image";

const cardIcons: Record<string, JSX.Element> = {
  generic: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8.5 15.5l7-7m-4.5 0h4.5v4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  next: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="1" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  previous: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="9" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  github: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2z"/>
    </svg>
  ),
  red: (
    <Image src="/red.png" alt="Red Icon" width={48} height={48} />
  ),
  rdi: (<>
    <Image src="/rdi.png" alt="RDI Icon" width={64} height={64} className="hidden dark:block" />
    <Image src="/rdi-light.png" alt="RDI Icon Light" width={64} height={64} className="dark:hidden" />
  </>
  ),
  bri: (
    <Image src="/bri.png" alt="Bri Nicole Icon" width={64} height={64} className="rounded-full" />
  ),
  eliteentries: (
    <Image src="/eliteentries.ico" alt="Elite Entries Icon" width={64} height={64} className="rounded-full" />
  ),
  peak:(
    <Image src="/peak.png" alt="Peak Icon" width={64} height={64} className="rounded-full" />
  ),
  ga:(
    <Image src="/ga.png" alt="GA Icon" width={64} height={64} className="rounded-full" />
  )
};

export default cardIcons;