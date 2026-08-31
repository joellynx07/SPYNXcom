import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "./LanguageContext";

const VoiceContext = createContext(null);

const SPEECH_LANG_CODE = { en: "en-US", fr: "fr-FR", tw: "en-US" }; // browsers rarely ship a Twi voice — fall back to an English voice reading Twi text
const WAKE_WORD = /\bspynx\b/i;

function getRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function VoiceProvider({ children }) {
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();

  const supported = typeof window !== "undefined" && !!getRecognitionCtor() && !!window.speechSynthesis;
  const [micOn, setMicOn] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | listening | asking-language | reading
  const [readMode, setReadMode] = useState(false);

  const recognitionRef = useRef(null);
  const modeRef = useRef("wake"); // "wake" | "language" — which phase the recognizer is in
  const micOnRef = useRef(false);

  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  const speak = useCallback(
    (text, langOverride) =>
      new Promise((resolve) => {
        if (!window.speechSynthesis) return resolve();
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = SPEECH_LANG_CODE[langOverride || lang] || "en-US";
        utter.rate = 1;
        utter.onend = resolve;
        utter.onerror = resolve;
        window.speechSynthesis.speak(utter);
      }),
    [lang]
  );

  const readPage = useCallback(() => {
    setStatus("reading");
    const title = document.querySelector("main h1")?.textContent?.trim();
    const sub = document.querySelector("main p")?.textContent?.trim();
    const parts = [title, sub].filter(Boolean);
    const text = parts.length ? parts.join(". ") : document.title;
    speak(text).then(() => setStatus(readMode ? "listening" : "idle"));
  }, [speak, readMode]);

  function startWakeRecognition() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    modeRef.current = "wake";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      if (modeRef.current === "wake" && WAKE_WORD.test(transcript)) {
        recognition.stop();
        handleWakeWord();
      }
    };
    recognition.onerror = () => {
      /* mic errors are common (silence, permission blips) — the onend restart handles recovery */
    };
    recognition.onend = () => {
      if (micOnRef.current && modeRef.current === "wake") {
        try {
          recognition.start();
        } catch {
          /* already started */
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setStatus("listening");
    } catch {
      /* ignore duplicate start */
    }
  }

  async function handleWakeWord() {
    setStatus("asking-language");
    await speak(t("voice.askLanguage"));
    listenForLanguageChoice();
  }

  function listenForLanguageChoice() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    modeRef.current = "language";

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      let chosen = null;
      if (/\b(twi|tw)\b/.test(transcript)) chosen = "tw";
      else if (/\b(french|français|francais|fr)\b/.test(transcript)) chosen = "fr";
      else if (/\b(english|en)\b/.test(transcript)) chosen = "en";

      if (chosen) {
        setLang(chosen);
        const label = { en: "English", tw: "Twi", fr: "Français" }[chosen];
        await speak(`${t("voice.confirmed")} ${label}.`, chosen);
        setReadMode(true);
        setTimeout(() => readPage(), 300);
      } else {
        await speak(t("voice.askLanguage"));
        listenForLanguageChoice();
        return;
      }
      modeRef.current = "wake";
      if (micOnRef.current) startWakeRecognition();
    };
    recognition.onerror = () => {
      modeRef.current = "wake";
      if (micOnRef.current) startWakeRecognition();
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* ignore */
    }
  }

  const enableVoice = useCallback(() => {
    if (!supported) return;
    setMicOn(true);
    micOnRef.current = true;
    startWakeRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const disableVoice = useCallback(() => {
    setMicOn(false);
    micOnRef.current = false;
    setReadMode(false);
    setStatus("idle");
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    window.speechSynthesis?.cancel();
  }, []);

  // Auto-read each new page while read mode is active
  useEffect(() => {
    if (!readMode) return;
    const timer = setTimeout(() => readPage(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, readMode]);

  // Announce clicked buttons/links while read mode is active — a lightweight accessibility touch
  useEffect(() => {
    if (!readMode) return;
    function onClick(e) {
      const el = e.target.closest("button, a");
      if (!el) return;
      const label = el.getAttribute("aria-label") || el.textContent?.trim();
      if (label && label.length < 60) speak(label);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [readMode, speak]);

  useEffect(() => () => disableVoice(), []); // cleanup on unmount

  return (
    <VoiceContext.Provider value={{ supported, micOn, status, readMode, enableVoice, disableVoice, readPage, speak }}>
      {children}
    </VoiceContext.Provider>
  );
}

export const useVoice = () => useContext(VoiceContext);
