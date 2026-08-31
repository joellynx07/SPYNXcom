import React, { useState, useRef, useEffect } from "react";
import { THEMES, useTheme } from "../ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change theme"
        className="w-8 h-8 rounded-full border hairline hover:border-gold flex items-center justify-center overflow-hidden"
      >
        <span className="w-4 h-4 rounded-full" style={{ background: `conic-gradient(${current.swatch.join(",")})` }} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 glass-card rounded-xl p-2 z-50 animate-fade-in-up max-h-80 overflow-y-auto scrollbar-thin">
          <p className="text-[11px] uppercase tracking-widest text-sand/40 px-2 py-1">Theme</p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition-colors ${
                t.id === theme ? "bg-gold/15 text-gold-bright" : "hover:bg-sand/5"
              }`}
            >
              <span className="w-4 h-4 rounded-full shrink-0" style={{ background: `conic-gradient(${t.swatch.join(",")})` }} />
              {t.label}
              {t.id === theme && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
