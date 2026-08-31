import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

const goldIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickToPlace({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, address, onChange }) {
  const [locating, setLocating] = useState(false);
  const center = [lat || 5.6037, lng || -0.187];

  async function reverseGeocode(la, ln) {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${ln}`);
      const data = await resp.json();
      return data.display_name || address || "";
    } catch {
      return address || "";
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        const addr = await reverseGeocode(la, ln);
        onChange({ lat: la, lng: ln, address: addr });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handlePick(la, ln) {
    const addr = await reverseGeocode(la, ln);
    onChange({ lat: la, lng: ln, address: addr });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          placeholder="Location, e.g. East Legon, Accra"
          value={address || ""}
          onChange={(e) => onChange({ lat, lng, address: e.target.value })}
          className="flex-1 bg-obsidian-soft/60 border hairline rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
        />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="shrink-0 border hairline hover:border-gold rounded-lg px-3 py-2.5 text-sm disabled:opacity-50"
        >
          {locating ? "Locating…" : "📍 Use my location"}
        </button>
      </div>
      <div className="h-48 rounded-lg overflow-hidden hairline border">
        <MapContainer center={center} zoom={lat ? 13 : 6} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickToPlace onPick={handlePick} />
          {lat && lng && <Marker position={[lat, lng]} icon={goldIcon} />}
        </MapContainer>
      </div>
      <p className="text-[11px] text-sand/40">Click the map to fine-tune the pin, or use the button to detect your current location.</p>
    </div>
  );
}
