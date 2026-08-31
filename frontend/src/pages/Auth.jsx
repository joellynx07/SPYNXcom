import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import LocationPicker from "../components/LocationPicker";

export default function Auth() {
  const { signIn, register } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", momo_number: "", lat: null, lng: null, address: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn({ email: form.email, password: form.password });
        navigate("/");
      } else {
        const data = await register({ ...form, language: lang });
        if (data.devVerifyUrl) setDevVerifyUrl(data.devVerifyUrl);
        else navigate("/");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (devVerifyUrl) {
    return (
      <div className="max-w-md mx-auto px-5 py-16">
        <div className="glass-card rounded-2xl p-7 text-center">
          <div className="text-3xl mb-3">📬</div>
          <h1 className="font-display text-xl gold-text mb-2">{t("auth.checkEmail")}</h1>
          <p className="text-sand/60 text-sm mb-5">
            {t("auth.checkEmailBody")} <strong>{form.email}</strong>.
          </p>
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 text-xs text-left mb-5">
            <p className="text-gold-bright font-semibold mb-1">Dev mode notice</p>
            <p className="text-sand/70">No email provider is configured yet (RESEND_API_KEY), so here's your verification link directly:</p>
            <a href={devVerifyUrl} className="text-lapis-soft break-all underline">
              {devVerifyUrl}
            </a>
          </div>
          <button onClick={() => navigate("/")} className="w-full bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full py-2.5">
            {t("auth.continueBtn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <div className="glass-card rounded-2xl p-7">
        <div className="text-center mb-6">
          <img src="/spynx-logo.png" alt="SPYNX" className="w-14 h-14 object-contain mx-auto mb-2" />
          <h1 className="font-display text-xl gold-text">{mode === "login" ? t("auth.welcomeBack") : t("auth.join")}</h1>
          <p className="text-sand/50 text-xs mt-1">{t("auth.subtitle")}</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <input
              required
              placeholder={t("auth.fullName")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
            />
          )}
          <input
            required
            type="email"
            placeholder={t("auth.email")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <input
            required
            type="password"
            placeholder={t("auth.password")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
          {mode === "register" && (
            <>
              <input
                placeholder={t("auth.phone")}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <p className="text-[11px] text-sand/40 -mt-1 px-1">Used for buyer calls/WhatsApp on your listings, and payout confirmations.</p>
              <input
                placeholder={t("auth.momo")}
                value={form.momo_number}
                onChange={(e) => setForm({ ...form, momo_number: e.target.value })}
                className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <div>
                <label className="text-xs uppercase tracking-widest text-sand/40 mb-2 block">{t("auth.locationLabel")}</label>
                <LocationPicker lat={form.lat} lng={form.lng} address={form.address} onChange={({ lat, lng, address }) => setForm({ ...form, lat, lng, address })} />
              </div>
            </>
          )}

          {error && <p className="text-red-300 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <button disabled={loading} className="w-full bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full py-2.5 transition-colors disabled:opacity-50">
            {loading ? t("auth.pleaseWait") : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
          </button>
        </form>

        <p className="text-center text-sm text-sand/50 mt-5">
          {mode === "login" ? t("auth.newHere") : t("auth.haveAccount")}{" "}
          <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-gold hover:underline">
            {mode === "login" ? t("auth.createLink") : t("auth.signInLink")}
          </button>
        </p>
      </div>
    </div>
  );
}
