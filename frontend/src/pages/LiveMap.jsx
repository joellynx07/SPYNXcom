import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { api, resolveUpload } from "../api";

const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LiveMap() {
  const [listings, setListings] = useState([]);
  const [category, setCategory] = useState("");

  useEffect(() => {
    const qs = new URLSearchParams(category ? { category } : {});
    api.get(`/listings?${qs.toString()}`).then(setListings);
  }, [category]);

  const pinned = listings.filter((l) => l.lat && l.lng);
  const center = pinned.length ? [pinned[0].lat, pinned[0].lng] : [5.6037, -0.187];

  return (
    <div className="max-w-7xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="font-display text-2xl gold-text">Live map</h1>
          <p className="text-sand/50 text-sm">Devices for sale near you, in real time.</p>
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2 text-sm">
          <option value="" className="bg-obsidian">All categories</option>
          <option value="phone" className="bg-obsidian">Phones</option>
          <option value="phone_accessory" className="bg-obsidian">Phone Accessories</option>
          <option value="computer" className="bg-obsidian">Computers / Laptops</option>
          <option value="computer_accessory" className="bg-obsidian">Computer Accessories</option>
          <option value="electronics" className="bg-obsidian">Electronics & Gadgets</option>
        </select>
      </div>

      <div className="h-[70vh] rounded-2xl overflow-hidden hairline border glass-card">
        <MapContainer center={center} zoom={pinned.length ? 12 : 6} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pinned.map((l) => (
            <Marker key={l.id} position={[l.lat, l.lng]} icon={pinIcon}>
              <Popup>
                <div className="w-40">
                  {l.images?.[0] && <img src={resolveUpload(l.images[0])} className="w-full h-20 object-cover rounded mb-1" alt="" />}
                  <p className="font-semibold text-xs">{l.title}</p>
                  <p className="text-xs opacity-70 mb-1">
                    {l.price.toLocaleString()} {l.currency}
                  </p>
                  <Link to={`/listing/${l.id}`} className="text-xs underline">
                    View listing
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {pinned.length === 0 && <p className="text-sand/50 text-sm mt-4 text-center">No pinned listings yet — sellers who add a location will show up here.</p>}
    </div>
  );
}
