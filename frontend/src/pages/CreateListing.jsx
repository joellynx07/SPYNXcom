import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import CommissionModal from "../components/CommissionModal";
import LocationPicker from "../components/LocationPicker";

const CATEGORIES = [
  { id: "phone", label: "📱 Phone" },
  { id: "phone_accessory", label: "🎧 Phone Accessory" },
  { id: "computer", label: "💻 Computer / Laptop" },
  { id: "computer_accessory", label: "🖱️ Computer Accessory" },
  { id: "electronics", label: "🔌 Electronics & Gadgets" },
];

const CONDITIONS = ["Brand new (sealed)", "Like new", "Used - Excellent", "Used - Good", "Used - Fair", "For parts"];

const SPEC_FIELDS = {
  phone: [
    { key: "brand", label: "Brand", placeholder: "Apple, Samsung, Tecno…" },
    { key: "model", label: "Model", placeholder: "iPhone 13 Pro" },
    { key: "storage", label: "Storage", placeholder: "128GB" },
    { key: "ram", label: "RAM", placeholder: "6GB" },
    { key: "color", label: "Color", placeholder: "Graphite" },
    { key: "battery_health", label: "Battery health", placeholder: "89%" },
    { key: "accessories_included", label: "Accessories included", placeholder: "Charger, box, case" },
    { key: "warranty", label: "Warranty", placeholder: "3 months seller warranty" },
  ],
  computer: [
    { key: "brand", label: "Brand", placeholder: "Dell, HP, Apple, Lenovo…" },
    { key: "model", label: "Model", placeholder: "MacBook Pro 14\" M2" },
    { key: "processor", label: "Processor", placeholder: "Intel i7 12th Gen / M2 Pro" },
    { key: "ram", label: "RAM", placeholder: "16GB" },
    { key: "storage", label: "Storage", placeholder: "512GB SSD" },
    { key: "screen_size", label: "Screen size", placeholder: "14 inch" },
    { key: "gpu", label: "Graphics (GPU)", placeholder: "RTX 3060 / Integrated" },
    { key: "battery_health", label: "Battery health / cycles", placeholder: "92% · 210 cycles" },
    { key: "accessories_included", label: "Accessories included", placeholder: "Charger, bag" },
    { key: "warranty", label: "Warranty", placeholder: "6 months seller warranty" },
  ],
  phone_accessory: [
    { key: "brand", label: "Brand", placeholder: "Anker, Belkin, Apple…" },
    { key: "type", label: "Type", placeholder: "Charger, case, earbuds, screen protector…" },
    { key: "compatible_with", label: "Compatible with", placeholder: "iPhone 12–15, USB-C phones…" },
  ],
  computer_accessory: [
    { key: "brand", label: "Brand", placeholder: "Logitech, HP, Dell…" },
    { key: "type", label: "Type", placeholder: "Mouse, keyboard, monitor, dock, RAM stick…" },
    { key: "compatible_with", label: "Compatible with", placeholder: "Windows / Mac / Universal" },
  ],
  electronics: [
    { key: "brand", label: "Brand", placeholder: "Sony, JBL, Samsung, DJI…" },
    { key: "type", label: "Type", placeholder: "TV, headphones, smartwatch, camera, drone, console…" },
    { key: "power_source", label: "Power source", placeholder: "Battery / mains / rechargeable" },
    { key: "accessories_included", label: "Accessories included", placeholder: "Charger, cables, remote" },
    { key: "warranty", label: "Warranty", placeholder: "3 months seller warranty" },
  ],
};

export default function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: "phone", price: "", currency: "GHS", description: "", condition: "Used - Excellent" });
  const [specs, setSpecs] = useState({});
  const [loc, setLoc] = useState({ lat: user?.lat, lng: user?.lng, address: user?.address || "" });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commissionData, setCommissionData] = useState(null);

  const activeFields = SPEC_FIELDS[form.category] || [];

  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (!user?.email_verified) {
      setError("Please verify your email before listing an item — check Settings for a resend link.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("category", form.category);
      fd.append("price", form.price);
      fd.append("currency", form.currency);
      fd.append("description", form.description);
      fd.append("location", loc.address || "");
      if (loc.lat) fd.append("lat", loc.lat);
      if (loc.lng) fd.append("lng", loc.lng);
      fd.append("attributes", JSON.stringify({ condition: form.condition, ...specs }));
      files.forEach((f) => fd.append("images", f));
      const data = await api.postForm("/listings", fd);
      setCommissionData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-2xl gold-text mb-1">List a device</h1>
      <p className="text-sand/50 text-sm mb-8">
        SPYNXcomerce is phones, computers, accessories, and electronics/gadgets only — the more specs you add, the faster it sells. Not sure what to write? Say "Spynx" in the AI box and paste a photo.
      </p>

      {!user?.email_verified && (
        <div className="bg-gold/10 border border-gold/30 rounded-lg px-4 py-3 text-sm mb-6">
          Your email isn't verified yet — you can fill this form in, but publishing requires verification.{" "}
          <a href="/account" className="underline text-gold-bright">
            Verify now
          </a>
          .
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 glass-card rounded-2xl p-6">
        <select
          value={form.category}
          onChange={(e) => {
            setForm({ ...form, category: e.target.value });
            setSpecs({});
          }}
          className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id} className="bg-obsidian">
              {c.label}
            </option>
          ))}
        </select>

        <input
          required
          placeholder="Title, e.g. iPhone 13 Pro 256GB — Graphite"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />

        <select
          value={form.condition}
          onChange={(e) => setForm({ ...form, condition: e.target.value })}
          className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        >
          {CONDITIONS.map((c) => (
            <option key={c} value={c} className="bg-obsidian">
              {c}
            </option>
          ))}
        </select>

        <div>
          <p className="text-xs uppercase tracking-widest text-sand/40 mb-2">Specs — the more filled in, the more trust you build</p>
          <div className="grid grid-cols-2 gap-3">
            {activeFields.map((f) => (
              <input
                key={f.key}
                placeholder={f.label + (f.placeholder ? ` (${f.placeholder})` : "")}
                value={specs[f.key] || ""}
                onChange={(e) => setSpecs({ ...specs, [f.key]: e.target.value })}
                className="bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
              />
            ))}
          </div>
        </div>

        <textarea
          required
          rows={4}
          placeholder="Description — condition details, reason for selling, anything a buyer should know"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="number"
            min="0"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          >
            {["GHS", "USD", "NGN", "EUR", "GBP"].map((c) => (
              <option key={c} value={c} className="bg-obsidian">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-sand/40 mb-2 block">Where is this item?</label>
          <LocationPicker lat={loc.lat} lng={loc.lng} address={loc.address} onChange={setLoc} />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-sand/40 mb-2 block">Photos</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full text-sm text-sand/70 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gold file:text-obsidian file:font-semibold file:cursor-pointer"
          />
        </div>

        {error && <p className="text-red-300 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

        <button disabled={loading} className="w-full bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full py-2.5 transition-colors disabled:opacity-50">
          {loading ? "Saving…" : "Continue to publish"}
        </button>
      </form>

      {commissionData && (
        <CommissionModal listing={commissionData.listing} commission={commissionData.commission} onClose={() => navigate("/seller")} onPublished={() => navigate("/seller")} />
      )}
    </div>
  );
}
