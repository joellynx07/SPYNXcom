import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api";
import { useLanguage } from "../LanguageContext";
import ListingCard from "../components/ListingCard";

export default function Home() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [category, setCategory] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const CATEGORIES = [
    { id: "", label: t("home.categoryAll") },
    { id: "phone", label: t("home.categoryPhone") },
    { id: "phone_accessory", label: t("home.categoryPhoneAcc") },
    { id: "computer", label: t("home.categoryComputer") },
    { id: "computer_accessory", label: t("home.categoryComputerAcc") },
    { id: "electronics", label: t("home.categoryElectronics") },
  ];

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(category ? { category } : {}) });
    api
      .get(`/listings?${qs.toString()}`)
      .then(setListings)
      .finally(() => setLoading(false));
  }, [q, category]);

  return (
    <div>
      <section className="riddle-bg border-b hairline">
        <div className="max-w-7xl mx-auto px-5 py-14 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold/70 mb-3">{t("home.eyebrow")}</p>
          <h1 className="font-display text-3xl md:text-5xl gold-text mb-4">{t("home.headline")}</h1>
          <p className="text-sand/60 max-w-xl mx-auto mb-6">{t("home.subhead")}</p>
          <Link to="/map" className="inline-flex items-center gap-2 border hairline hover:border-gold rounded-full px-5 py-2 text-sm transition-colors">
            🗺️ {t("home.mapCta")}
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                category === c.id ? "bg-gold text-obsidian border-gold font-semibold" : "hairline hover:border-gold/60"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sand/50">{t("home.loading")}</p>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-3xl mb-3">📦</p>
            <p className="text-sand/60">{t("home.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
