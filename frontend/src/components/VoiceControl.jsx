import React from "react";
import { useVoice } from "../VoiceContext";
import { useLanguage } from "../LanguageContext";

export default function VoiceControl() {
  const voice = useVoice();
  const { t } = useLanguage();

  if (!voice?.supported) return null;

  const label = voice.micOn
    ? voice.status === "asking-language"
      ? t("voice.askLanguage")
      : voice.status === "reading"
      ? "Reading…"
      : t("voice.listening")
    : t("voice.off");

  return (
    <button
      onClick={() => (voice.micOn ? voice.disableVoice() : voice.enableVoice())}
      title={label}
      className={`fixed bottom-5 left-5 z-40 w-12 h-12 rounded-full border hairline flex items-center justify-center text-lg transition-colors ${
        voice.micOn ? "bg-lapis/20 border-lapis text-lapis-soft animate-mic-pulse" : "bg-obsidian-card hover:border-gold"
      }`}
      aria-label="Toggle voice control"
    >
      {voice.micOn ? "🎙️" : "🎤"}
    </button>
  );
}
