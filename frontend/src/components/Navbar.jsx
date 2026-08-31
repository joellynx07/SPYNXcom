import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useAI } from "../AIContext";
import { useLanguage } from "../LanguageContext";
import { api } from "../api";
import ThemeSwitcher from "./ThemeSwitcher";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { trySummon } = useAI();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () => api.get("/messages/unread-count").then((d) => setUnread(d.count)).catch(() => {});
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [user]);

  function handleSearch(e) {
    e.preventDefault();
    const q = new FormData(e.target).get("q") || "";
    if (trySummon(q)) {
      e.target.reset();
      return;
    }
    navigate(`/?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-obsidian/85 backdrop-blur">
      <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/spynx-logo.png" alt="SPYNX" className="w-8 h-8 object-contain" />
          <span className="font-display text-lg gold-text tracking-wide">SPYNXcomerce</span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 hidden md:block">
          <input
            name="q"
            placeholder='Search phones, computers, gadgets — or type "Spynx" to ask the AI…'
            className="w-full bg-obsidian-soft/60 border hairline rounded-full px-4 py-2 text-sm placeholder:text-sand/40 focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </form>

        <nav className="flex items-center gap-3 text-sm shrink-0">
          <Link to="/" className="hover:text-gold transition-colors hidden sm:inline">
            {t("nav.browse")}
          </Link>
          <Link to="/map" className="hover:text-gold transition-colors hidden sm:inline">
            {t("nav.map")}
          </Link>
          {user && (
            <Link to="/seller" className="hover:text-gold transition-colors hidden sm:inline">
              {t("nav.sell")}
            </Link>
          )}
          {user && (
            <Link to="/orders" className="hover:text-gold transition-colors hidden sm:inline">
              {t("nav.orders")}
            </Link>
          )}
          {user && (
            <Link to="/messages" className="relative hover:text-gold transition-colors hidden sm:inline">
              {t("nav.messages")}
              {unread > 0 && (
                <span className="absolute -top-2 -right-3 text-[10px] bg-gold text-obsidian rounded-full px-1.5 font-bold">{unread}</span>
              )}
            </Link>
          )}

          <LanguageSwitcher />
          <ThemeSwitcher />

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/account" className="flex items-center gap-1.5 text-sand/70 hover:text-gold" title={t("nav.settings")}>
                <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                {user.email_verified ? (
                  <span title="Verified account" className="text-lapis-soft">
                    ✓
                  </span>
                ) : (
                  <span title="Email not verified yet" className="text-gold/70">
                    !
                  </span>
                )}
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="border hairline rounded-full px-3 py-1.5 hover:border-gold transition-colors"
              >
                {t("nav.signout")}
              </button>
            </div>
          ) : (
            <Link to="/auth" className="bg-gold text-obsidian font-semibold rounded-full px-4 py-1.5 hover:bg-gold-bright transition-colors">
              {t("nav.signin")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
