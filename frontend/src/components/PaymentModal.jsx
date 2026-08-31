import React, { useState } from "react";
import { api } from "../api";
import { useLanguage } from "../LanguageContext";

export default function PaymentModal({ listing, onClose }) {
  const { t } = useLanguage();
  const [provider, setProvider] = useState("paystack");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const feePct = 2;
  const buyerFee = Math.round(listing.price * (feePct / 100) * 100) / 100;
  const total = listing.price + buyerFee;

  async function pay() {
    setLoading(true);
    setStatus(null);
    try {
      const data = await api.post(`/payments/order/${listing.id}`, { provider });
      if (data.pendingManualVerification) {
        setStatus({ type: "pending", message: data.message });
        return;
      }
      if (data.redirectUrl) window.open(data.redirectUrl, "_blank");
      if (data.demo) {
        setStatus({ type: "success", message: "Demo payment complete — order placed! The seller has been notified." });
      } else {
        setStatus({ type: "info", message: "Complete payment in the new tab. We'll notify the seller once it's confirmed." });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="glass-card rounded-2xl w-full max-w-md p-6 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-sand/50 hover:text-gold">
          ✕
        </button>
        <div className="text-3xl mb-2">𓆃</div>
        <h2 className="font-display text-xl gold-text mb-1">{t("payment.title")}</h2>
        <p className="text-sand/60 text-sm mb-5">"{listing.title}"</p>

        <div className="glass-card rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-sand/60">{t("payment.itemPrice")}</span>
            <span className="font-mono">
              {listing.price.toLocaleString()} {listing.currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sand/60">
              {t("payment.buyerFee")} ({feePct}%)
            </span>
            <span className="font-mono">
              {buyerFee.toLocaleString()} {listing.currency}
            </span>
          </div>
          <div className="h-px bg-gold/20 my-1" />
          <div className="flex justify-between font-semibold">
            <span>{t("payment.total")}</span>
            <span className="font-mono text-gold-bright">
              {total.toLocaleString()} {listing.currency}
            </span>
          </div>
        </div>

        <p className="text-xs uppercase tracking-widest text-sand/40 mb-2">{t("payment.choose")}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: "paystack", label: t("payment.momo") },
            { id: "manual_momo", label: t("payment.direct") },
            { id: "stripe", label: t("payment.card") },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setProvider(opt.id)}
              className={`rounded-lg border p-3 text-sm font-semibold transition-colors ${
                provider === opt.id ? "border-gold bg-gold/10" : "hairline hover:border-gold/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {status && (
          <div className={`text-sm rounded-lg px-3 py-2 mb-4 ${status.type === "error" ? "bg-red-500/10 text-red-300" : "bg-gold/10 text-gold-bright"}`}>
            {status.message}
          </div>
        )}

        <button
          onClick={pay}
          disabled={loading}
          className="w-full bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full py-2.5 transition-colors disabled:opacity-50"
        >
          {loading ? t("payment.processing") : `${t("payment.pay")} ${total.toLocaleString()} ${listing.currency}`}
        </button>
      </div>
    </div>
  );
}
