import React, { useEffect, useState } from "react";
import { api, resolveUpload } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders/buying").then(setOrders);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl gold-text mb-6">Your purchases</h1>
      {orders.length === 0 && <p className="text-sand/50">You haven't bought anything yet.</p>}
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-obsidian-soft overflow-hidden shrink-0 flex items-center justify-center">
              {o.images?.[0] ? <img src={resolveUpload(o.images[0])} className="w-full h-full object-cover" /> : "📦"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{o.title}</p>
              <p className="text-sand/50 text-xs">{new Date(o.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-gold-bright text-sm">
                {(o.amount + o.buyer_fee).toLocaleString()} {o.currency}
              </p>
              <p className="text-xs text-sand/50">{o.payment_status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
