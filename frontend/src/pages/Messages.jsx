import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";

function toWhatsAppNumber(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "233" + digits.slice(1);
  return digits;
}

export default function Messages() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(params.get("with") || null);
  const [activeName, setActiveName] = useState(params.get("name") || "");
  const [activePhone, setActivePhone] = useState(null);
  const [thread, setThread] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  function loadThreads() {
    api.get("/messages/threads").then(setThreads);
  }

  function loadThread(id) {
    if (!id) return;
    api.get(`/messages/thread/${id}`).then((rows) => {
      setThread(rows);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 30);
    });
  }

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadThread(activeId);
    const interval = setInterval(() => loadThread(activeId), 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  async function send() {
    if (!input.trim() || !activeId) return;
    const body = input.trim();
    setInput("");
    await api.post("/messages", { recipientId: activeId, body });
    loadThread(activeId);
    loadThreads();
  }

  const waNumber = toWhatsAppNumber(activePhone);

  if (!user) return <div className="max-w-md mx-auto px-5 py-16 text-sand/50">Please sign in.</div>;

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <h1 className="font-display text-2xl gold-text mb-6">{t("messages.title")}</h1>
      <div className="grid md:grid-cols-3 gap-4 h-[70vh]">
        <div className="glass-card rounded-xl overflow-y-auto scrollbar-thin">
          {threads.length === 0 && <p className="text-sand/50 text-sm p-4">{t("messages.noThreads")}</p>}
          {threads.map((th) => (
            <button
              key={th.userId}
              onClick={() => {
                setActiveId(th.userId);
                setActiveName(th.userName);
                setActivePhone(th.userPhone);
              }}
              className={`w-full text-left px-4 py-3 border-b hairline hover:bg-sand/5 transition-colors ${activeId === th.userId ? "bg-gold/10" : ""}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{th.userName}</p>
                {th.unread > 0 && <span className="text-[10px] bg-gold text-obsidian rounded-full px-1.5 py-0.5 font-bold">{th.unread}</span>}
              </div>
              <p className="text-xs text-sand/50 truncate">{th.lastMessage}</p>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 glass-card rounded-xl flex flex-col overflow-hidden">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center text-sand/40 text-sm">{t("messages.selectThread")}</div>
          ) : (
            <>
              <div className="px-4 py-3 border-b hairline flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{activeName}</p>
                <div className="flex gap-2">
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs border border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-full px-3 py-1.5"
                    >
                      💚 {t("listing.whatsapp")}
                    </a>
                  )}
                  {activePhone && (
                    <a href={`tel:${activePhone}`} className="text-xs border hairline hover:border-gold rounded-full px-3 py-1.5">
                      📞 {t("listing.callSeller")}
                    </a>
                  )}
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2">
                {thread.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.sender_id === user.id ? "bg-gold/20 text-sand" : "bg-obsidian-soft border hairline text-sand/90"}`}>
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t hairline flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder={t("messages.typeMessage")}
                  className="flex-1 bg-obsidian-soft/60 border hairline rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <button onClick={send} className="bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full px-5 text-sm">
                  {t("messages.send")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
