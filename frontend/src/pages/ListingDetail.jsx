import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { api, resolveUpload } from "../api";
import { useAuth } from "../AuthContext";
import { useAI } from "../AIContext";
import { useLanguage } from "../LanguageContext";
import PaymentModal from "../components/PaymentModal";

const categoryIcon = { phone: "📱", phone_accessory: "🎧", computer: "💻", computer_accessory: "🖱️", electronics: "🔌" };
const categoryLabel = { phone: "Phone", phone_accessory: "Phone Accessory", computer: "Computer / Laptop", computer_accessory: "Computer Accessory", electronics: "Electronics & Gadgets" };

const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const SPEC_LABELS = {
  brand: "Brand",
  model: "Model",
  storage: "Storage",
  ram: "RAM",
  color: "Color",
  battery_health: "Battery health",
  accessories_included: "Accessories included",
  warranty: "Warranty",
  processor: "Processor",
  screen_size: "Screen size",
  gpu: "Graphics (GPU)",
  type: "Type",
  compatible_with: "Compatible with",
  condition: "Condition",
  power_source: "Power source",
};

// Formats a raw phone number into a WhatsApp-ready international digit string,
// assuming Ghanaian numbers (0XXXXXXXXX) when no country code is present.
function toWhatsAppNumber(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "233" + digits.slice(1);
  return digits;
}

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { openWithMessage } = useAI();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [showPay, setShowPay] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}`).then(setListing);
  }, [id]);

  if (!listing) return <div className="max-w-5xl mx-auto px-5 py-16 text-sand/50">{t("listing.loading")}</div>;

  const specs = Object.entries(listing.attributes || {}).filter(([, v]) => v);
  const waNumber = toWhatsAppNumber(listing.seller_phone);

  function messageSeller() {
    if (!user) return navigate("/auth");
    navigate(`/messages?with=${listing.seller_id}&name=${encodeURIComponent(listing.seller_name)}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-[4/3] rounded-xl overflow-hidden glass-card flex items-center justify-center mb-3">
            {listing.images?.length ? (
              <img src={resolveUpload(listing.images[activeImg])} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl text-gold/30">{categoryIcon[listing.category] || "📦"}</span>
            )}
          </div>
          {listing.images?.length > 1 && (
            <div className="flex gap-2">
              {listing.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border ${i === activeImg ? "border-gold" : "hairline"}`}>
                  <img src={resolveUpload(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-gold/70 mb-2">
            {categoryIcon[listing.category]} {categoryLabel[listing.category] || listing.category}
          </p>
          <h1 className="font-display text-2xl mb-2">{listing.title}</h1>
          <p className="text-sand/50 text-sm mb-4">
            {listing.location || "Location not set"} · Listed by {listing.seller_name} · {listing.views} views
          </p>
          <p className="font-mono text-3xl text-gold-bright mb-6">
            {listing.price.toLocaleString()} {listing.currency}
          </p>

          {user?.id === listing.seller_id ? (
            <p className="text-sand/50 text-sm mb-6">{t("listing.ownListing")}</p>
          ) : (
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => (user ? setShowPay(true) : navigate("/auth"))}
                className="flex-1 bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full px-6 py-3 transition-colors min-w-[160px]"
              >
                {t("listing.buyNow")} — {listing.price.toLocaleString()} {listing.currency}
              </button>
              <button onClick={messageSeller} className="shrink-0 border hairline hover:border-gold rounded-full px-4 py-3 text-sm" title={t("listing.messageSeller")}>
                💬 {t("listing.messageSeller")}
              </button>
              {waNumber && (
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I'm interested in "${listing.title}" on SPYNXcomerce.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 border border-green-500/40 text-green-400 hover:bg-green-500/10 rounded-full px-4 py-3 text-sm"
                  title={t("listing.whatsapp")}
                >
                  💚 {t("listing.whatsapp")}
                </a>
              )}
              {listing.seller_phone && (
                <a href={`tel:${listing.seller_phone}`} className="shrink-0 border hairline hover:border-gold rounded-full px-4 py-3 text-sm" title={t("listing.callSeller")}>
                  📞 {t("listing.callSeller")}
                </a>
              )}
              <button
                onClick={() =>
                  openWithMessage(
                    `Is this a fair price for a ${listing.title}? Here are the specs I can see: ${JSON.stringify(listing.attributes)}. Asking price: ${listing.price} ${listing.currency}.`,
                    listing.id
                  )
                }
                className="shrink-0 border hairline hover:border-gold rounded-full px-4 py-3 text-sm"
                title="Ask SPYNX AI to evaluate this listing"
              >
                🤖 {t("listing.askAi")}
              </button>
            </div>
          )}

          {specs.length > 0 && (
            <div className="glass-card rounded-xl p-4 mb-6">
              <p className="text-xs uppercase tracking-widest text-sand/40 mb-3">{t("listing.specs")}</p>
              <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                {specs.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sand/40 text-xs">{SPEC_LABELS[k] || k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <p className="text-sand/80 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
        </div>
      </div>

      {listing.lat && listing.lng && (
        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest text-sand/40 mb-2">{t("listing.itemLocation")}</p>
          <div className="h-56 rounded-xl overflow-hidden hairline border">
            <MapContainer center={[listing.lat, listing.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[listing.lat, listing.lng]} icon={pinIcon} />
            </MapContainer>
          </div>
        </div>
      )}

      {showPay && <PaymentModal listing={listing} onClose={() => setShowPay(false)} />}
    </div>
  );
}
