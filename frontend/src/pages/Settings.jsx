import React, { useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { useTheme, THEMES } from "../ThemeContext";
import { resolveUpload } from "../api";
import LocationPicker from "../components/LocationPicker";

export default function Settings() {
  const { user, login } = useAuth();
  const { t, lang, setLang, LANGUAGES } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

  const [loc, setLoc] = useState({ lat: user?.lat, lng: user?.lng, address: user?.address || "" });
  const [savingLoc, setSavingLoc] = useState(false);

  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "", momo_number: user?.momo_number || "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [bgUploading, setBgUploading] = useState(false);

  function refreshUser(updated) {
    login(localStorage.getItem("spynx_token"), updated);
  }

  async function resend() {
    setSending(true);
    setNotice(null);
    try {
      const data = await api.post("/auth/resend-verification", {});
      if (data.alreadyVerified) setNotice({ type: "info", text: "Your email is already verified." });
      else if (data.devVerifyUrl) setNotice({ type: "dev", text: data.devVerifyUrl });
      else setNotice({ type: "success", text: "Verification email sent — check your inbox." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setSending(false);
    }
  }

  async function saveLocation() {
    setSavingLoc(true);
    try {
      const data = await api.patch("/auth/location", loc);
      refreshUser(data.user);
      setNotice({ type: "success", text: "Location updated." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setSavingLoc(false);
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const data = await api.patch("/auth/settings", profile);
      refreshUser(data.user);
      setNotice({ type: "success", text: "Profile saved." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changeLanguage(id) {
    setLang(id);
    try {
      const data = await api.patch("/auth/language", { language: id });
      refreshUser(data.user);
    } catch {
      /* UI language still switches even if the server save fails */
    }
  }

  async function uploadBackground(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const data = await api.postForm("/auth/background", fd);
      refreshUser(data.user);
      setNotice({ type: "success", text: "Background updated." });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBgUploading(false);
      e.target.value = "";
    }
  }

  async function removeBackground() {
    try {
      const data = await api.delForm("/auth/background");
      refreshUser(data.user);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  if (!user) return <div className="max-w-md mx-auto px-5 py-16 text-sand/50">Please sign in.</div>;

  return (
    <div className="max-w-xl mx-auto px-5 py-12 space-y-6">
      <div>
        <h1 className="font-display text-2xl gold-text mb-1">{t("account.title")}</h1>
        <p className="text-sand/50 text-sm">{user.email}</p>
      </div>

      {notice && (
        <div className={`text-sm rounded-lg px-3 py-2 ${notice.type === "error" ? "bg-red-500/10 text-red-300" : "bg-gold/10 text-gold-bright"}`}>
          {notice.type === "dev" ? (
            <>
              Dev mode — verify directly:{" "}
              <a href={notice.text} className="underline break-all">
                {notice.text}
              </a>
            </>
          ) : (
            notice.text
          )}
        </div>
      )}

      {/* Verification */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-sm">{t("account.verification")}</p>
          {user.email_verified ? (
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-300">{t("account.verified")}</span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gold/15 text-gold-bright">{t("account.notVerified")}</span>
          )}
        </div>
        {!user.email_verified && (
          <button onClick={resend} disabled={sending} className="text-xs border hairline hover:border-gold rounded-full px-4 py-2 disabled:opacity-50">
            {sending ? "Sending…" : t("account.resend")}
          </button>
        )}
      </div>

      {/* Profile */}
      <div className="glass-card rounded-xl p-5">
        <p className="font-semibold text-sm mb-3">{t("account.profileTitle")}</p>
        <div className="space-y-2">
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Full name"
            className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <input
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="Phone (used for buyer calls & WhatsApp)"
            className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <input
            value={profile.momo_number}
            onChange={(e) => setProfile({ ...profile, momo_number: e.target.value })}
            placeholder="Mobile Money number (for payouts)"
            className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-3 w-full bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full py-2 text-sm disabled:opacity-50"
        >
          {savingProfile ? "Saving…" : t("account.saveProfile")}
        </button>
      </div>

      {/* Theme */}
      <div className="glass-card rounded-xl p-5">
        <p className="font-semibold text-sm mb-3">{t("account.themeTitle")}</p>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => setTheme(th.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                theme === th.id ? "border-gold bg-gold/10 text-gold-bright" : "hairline hover:border-gold/50"
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: `conic-gradient(${th.swatch.join(",")})` }} />
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="glass-card rounded-xl p-5">
        <p className="font-semibold text-sm mb-3">{t("account.languageTitle")}</p>
        <div className="flex gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => changeLanguage(l.id)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-sm transition-colors ${
                lang === l.id ? "border-gold bg-gold/10 text-gold-bright" : "hairline hover:border-gold/50"
              }`}
            >
              <span>{l.flag}</span> {l.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-sand/40 mt-3">{t("account.voiceHint")}</p>
      </div>

      {/* Custom background */}
      <div className="glass-card rounded-xl p-5">
        <p className="font-semibold text-sm mb-1">{t("account.backgroundTitle")}</p>
        <p className="text-xs text-sand/50 mb-3">{t("account.backgroundHint")}</p>
        {user.background_url && (
          <div className="w-full h-28 rounded-lg overflow-hidden mb-3 border hairline">
            <img src={resolveUpload(user.background_url)} alt="Current background" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex gap-2">
          <label className="flex-1 text-center cursor-pointer bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full py-2 text-sm">
            {bgUploading ? "Uploading…" : t("account.backgroundUpload")}
            <input type="file" accept="image/*" onChange={uploadBackground} className="hidden" disabled={bgUploading} />
          </label>
          {user.background_url && (
            <button onClick={removeBackground} className="border hairline hover:border-gold rounded-full px-4 text-sm">
              {t("account.backgroundRemove")}
            </button>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="glass-card rounded-xl p-5">
        <p className="font-semibold text-sm mb-3">{t("account.locationTitle")}</p>
        <LocationPicker lat={loc.lat} lng={loc.lng} address={loc.address} onChange={setLoc} />
        <button onClick={saveLocation} disabled={savingLoc} className="mt-3 w-full bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full py-2 text-sm disabled:opacity-50">
          {savingLoc ? "Saving…" : t("account.save")}
        </button>
      </div>
    </div>
  );
}
