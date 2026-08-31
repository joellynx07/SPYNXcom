import React from "react";
import { Link } from "react-router-dom";
import { resolveUpload } from "../api";

const categoryIcon = { phone: "📱", phone_accessory: "🎧", computer: "💻", computer_accessory: "🖱️", electronics: "🔌" };

export default function ListingCard({ listing }) {
  return (
    <Link to={`/listing/${listing.id}`} className="glass-card rounded-xl overflow-hidden hover:border-gold/60 transition-colors group">
      <div className="aspect-[4/3] bg-obsidian-soft flex items-center justify-center overflow-hidden">
        {listing.images?.[0] ? (
          <img
            src={resolveUpload(listing.images[0])}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-4xl text-gold/30">{categoryIcon[listing.category] || "📦"}</span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate">{listing.title}</p>
        <p className="text-sand/50 text-xs truncate mt-0.5">{listing.location || "Location not set"}</p>
        <p className="font-mono text-gold-bright mt-2">
          {listing.price?.toLocaleString()} {listing.currency}
        </p>
      </div>
    </Link>
  );
}
