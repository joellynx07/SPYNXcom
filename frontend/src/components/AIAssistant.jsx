import React, { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useAI } from "../AIContext";
import { useLanguage } from "../LanguageContext";

export default function AIAssistant() {
  const { user } = useAuth();
  const { open, setOpen, pendingMessage, setPendingMessage, listingId } = useAI();
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState([{ role: "assistant", content: t("ai.greeting") }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].role === "assistant" ? [{ role: "assistant", content: t("ai.greeting") }] : m));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function scrollToBottom() {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }

  async function send(text) {
    if (!text.trim()) return;
    if (!user) {
      setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "Please sign in so I can give you personalized help — it only takes a moment." }]);
      setInput("");
      scrollToBottom();
      return;
    }
    const history = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    scrollToBottom();
    try {
      const data = await api.post("/ai/chat", { message: text, history, listingId, language: lang });
      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, I hit an error: ${err.message}` }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  useEffect(() => {
    if (open && pendingMessage) {
      send(pendingMessage);
      setPendingMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pendingMessage]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      setMessages((m) => [...m, { role: "assistant", content: "Please sign in so I can analyze files for you." }]);
      return;
    }
    setMessages((m) => [...m, { role: "user", content: `📎 Uploaded: ${file.name}` }]);
    setLoading(true);
    scrollToBottom();
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("language", lang);
      const data = await api.postForm("/ai/analyze-file", form);
      setMessages((m) => [...m, { role: "assistant", content: data.text }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, I couldn't analyze that file: ${err.message}` }]);
    } finally {
      setLoading(false);
      e.target.value = "";
      scrollToBottom();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-gold hover:bg-gold-bright text-obsidian text-2xl shadow-lg shadow-gold/20 flex items-center justify-center transition-transform hover:scale-105 overflow-hidden ${
          !open ? "animate-pulse-ring" : ""
        }`}
        aria-label="Summon SPYNX AI"
      >
        {open ? "✕" : <img src="/spynx-logo.png" alt="" className="w-9 h-9 object-contain" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[92vw] max-w-sm h-[70vh] max-h-[560px] glass-card rounded-2xl flex flex-col overflow-hidden animate-fade-in-up">
          <div className="px-4 py-3 border-b hairline flex items-center gap-2">
            <img src="/spynx-logo.png" alt="" className="w-5 h-5 object-contain" />
            <div>
              <p className="font-display text-sm gold-text">{t("ai.title")}</p>
              <p className="text-[11px] text-sand/50">{t("ai.hint")}</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-lapis/25 text-sand" : "bg-obsidian-soft border hairline text-sand/90"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-sand/40">SPYNX AI is thinking…</div>}
          </div>

          <div className="p-3 border-t hairline">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileRef}
                onChange={handleFile}
                className="hidden"
                accept="image/*,audio/*,video/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              />
              <button
                onClick={() => fileRef.current?.click()}
                title="Attach image, audio, video, PDF, Word, Excel or PowerPoint"
                className="w-9 h-9 shrink-0 rounded-full border hairline hover:border-gold flex items-center justify-center text-sm"
              >
                📎
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder={t("ai.placeholder")}
                className="flex-1 bg-obsidian-soft/60 border hairline rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <button onClick={() => send(input)} className="w-9 h-9 shrink-0 rounded-full bg-gold hover:bg-gold-bright text-obsidian flex items-center justify-center">
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
