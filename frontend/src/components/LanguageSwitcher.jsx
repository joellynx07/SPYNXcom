import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../LanguageContext";
import { useAuth } from "../AuthContext";
import { api } from "../api";

export default function LanguageSwitcher() {
  const { lang, setLang, LANGUAGES } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = LANGUAGES.find((l) => l.id === lang) || LANGUAGES[0];

  async function choose(id) {
    setLang(id);
    setOpen(false);
    if (user) {
      try {
        await api.patch("/auth/language", { language: id });
      } catch {
        /* non-fatal */
      }
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change language"
        className="w-8 h-8 rounded-full border hairline hover:border-gold flex items-center justify-center text-sm"
      >
        {current.flag}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 glass-card rounded-xl p-2 z-50 animate-fade-in-up">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => choose(l.id)}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition-colors ${
                l.id === lang ? "bg-gold/15 text-gold-bright" : "hover:bg-sand/5"
              }`}
            >
              <span>{l.flag}</span>
              {l.label}
              {l.id === lang && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
