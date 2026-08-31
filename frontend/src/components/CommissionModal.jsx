import React, { useState } from "react";
import { api } from "../api";
import { useLanguage } from "../LanguageContext";

export default function CommissionModal({ listing, commission, onClose, onPublished }) {
  const { t } = useLanguage();
  const [provider, setProvider] = useState("paystack");
  const [momoNumber, setMomoNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  async function pay() {
    setLoading(true);
    setStatus(null);
    try {
      const body = { provider };
      if (provider === "manual_momo") body.momo_number = momoNumber;
      const data = await api.post(`/payments/commission/${listing.id}`, body);

      if (data.alreadyPaid) {
        onPublished?.();
        return;
      }
      if (data.pendingManualVerification) {
        setStatus({ type: "pending", message: data.message });
        return;
      }
      if (data.redirectUrl) window.open(data.redirectUrl, "_blank");
      if (data.demo) {
        setStatus({ type: "success", message: "Demo payment complete — your listing is now live! (Connect a real Paystack/Stripe key to charge real commission.)" });
        setTimeout(() => onPublished?.(), 1400);
      } else {
        setStatus({ type: "info", message: "Complete your payment in the new tab. Your listing goes live automatically once it's confirmed." });
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
        <div className="text-3xl mb-2">𓂀</div>
        <h2 className="font-display text-xl gold-text mb-1">{t("commission.title")}</h2>
        <p className="text-sand/60 text-sm mb-5">"{listing.title}" is saved as a draft. Pay the platform commission below to publish it live to every buyer.</p>

        <div className="glass-card rounded-xl p-4 mb-5 flex items-center justify-between">
          <span className="text-sand/60 text-sm">{t("commission.due")}</span>
          <span className="font-mono text-lg text-gold-bright">
            {commission.amount.toLocaleString()} {commission.currency}
          </span>
        </div>

        <p className="text-xs uppercase tracking-widest text-sand/40 mb-2">{t("commission.choose")}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: "paystack", label: t("commission.momo"), sub: t("commission.momoSub") },
            { id: "paystack_card", label: t("commission.card"), sub: t("commission.cardSub") },
            { id: "stripe", label: t("commission.stripe"), sub: t("commission.stripeSub") },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setProvider(opt.id === "paystack_card" ? "paystack" : opt.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                provider === (opt.id === "paystack_card" ? "paystack" : opt.id) ? "border-gold bg-gold/10" : "hairline hover:border-gold/50"
              }`}
            >
              <div className="text-sm font-semibold">{opt.label}</div>
              <div className="text-[11px] text-sand/50">{opt.sub}</div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setProvider("manual_momo")}
          className={`w-full text-left rounded-lg border p-3 mb-4 transition-colors ${
            provider === "manual_momo" ? "border-gold bg-gold/10" : "hairline hover:border-gold/50"
          }`}
        >
          <div className="text-sm font-semibold">{t("commission.alreadySent")}</div>
          <div className="text-[11px] text-sand/50">
            Send {commission.amount.toLocaleString()} {commission.currency} to {commission.momo_number} ({commission.momo_name}), then confirm here.
          </div>
        </button>

        {provider === "manual_momo" && (
          <input
            value={momoNumber}
            onChange={(e) => setMomoNumber(e.target.value)}
            placeholder="The Mobile Money number you paid from"
            className="w-full mb-4 bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
        )}

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
          {loading ? t("commission.processing") : `${t("commission.pay")} ${commission.amount.toLocaleString()} ${commission.currency}`}
        </button>
      </div>
    </div>
  );
}
