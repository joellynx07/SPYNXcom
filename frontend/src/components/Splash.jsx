import React, { useEffect, useState } from "react";

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1700);
    const t2 = setTimeout(() => onDone?.(), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian riddle-bg transition-opacity duration-500 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <img
        src="/spynx-logo.png"
        alt="SPYNX"
        className="w-28 h-28 object-contain mb-2 animate-glyph-rise"
        style={{ animationDelay: "0.1s", opacity: 0 }}
      />
      <h1
        className="font-display text-4xl md:text-5xl tracking-wide gold-text animate-glyph-rise"
        style={{ animationDelay: "0.25s", opacity: 0 }}
      >
        SPYNXcomerce
      </h1>
      <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent mt-5 w-64 overflow-hidden">
        <div className="h-px bg-gold animate-riddle-line" />
      </div>
      <p
        className="font-body text-sand/60 text-sm mt-4 tracking-[0.25em] uppercase animate-glyph-rise"
        style={{ animationDelay: "0.4s", opacity: 0 }}
      >
        Ask the market anything
      </p>
    </div>
  );
}
