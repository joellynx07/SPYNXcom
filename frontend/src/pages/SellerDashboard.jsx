import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useLanguage } from "../LanguageContext";
import CommissionModal from "../components/CommissionModal";

const statusLabel = {
  active: { text: "Live", cls: "bg-green-500/15 text-green-300" },
  pending_commission: { text: "Awaiting commission", cls: "bg-gold/15 text-gold-bright" },
  sold: { text: "Sold", cls: "bg-lapis/15 text-lapis-soft" },
};

export default function SellerDashboard() {
  const { lang } = useLanguage();
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [payTarget, setPayTarget] = useState(null);
  const [genLoading, setGenLoading] = useState(false);

  function refresh() {
    api.get("/listings/mine").then(setListings);
    api.get("/orders/selling").then(setOrders);
    api.get("/ai/reports").then(setReports);
  }

  useEffect(refresh, []);

  async function generateReport(action) {
    setGenLoading(true);
    try {
      await api.post("/ai/sales-report", { action, language: lang });
      refresh();
    } finally {
      setGenLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl gold-text">Seller dashboard</h1>
          <p className="text-sand/50 text-sm">Manage your listings and let SPYNX AI read your sales.</p>
        </div>
        <Link to="/sell/new" className="bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full px-5 py-2.5">
          + New listing
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm uppercase tracking-widest text-sand/40 mb-2">Your listings</h2>
          {listings.length === 0 && <p className="text-sand/50">You haven't listed anything yet.</p>}
          {listings.map((l) => (
            <div key={l.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">{l.title}</p>
                <p className="text-sand/50 text-xs mt-0.5">
                  {l.price.toLocaleString()} {l.currency} · {l.views} views
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full ${statusLabel[l.status]?.cls}`}>{statusLabel[l.status]?.text || l.status}</span>
                {l.status === "pending_commission" && (
                  <button onClick={() => setPayTarget(l)} className="text-xs border hairline hover:border-gold rounded-full px-3 py-1.5">
                    Pay commission
                  </button>
                )}
              </div>
            </div>
          ))}

          <h2 className="text-sm uppercase tracking-widest text-sand/40 mt-8 mb-2">Recent orders</h2>
          {orders.length === 0 && <p className="text-sand/50">No orders yet.</p>}
          {orders.map((o) => (
            <div key={o.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm">{o.title}</p>
              <p className="font-mono text-sm text-gold-bright">
                {o.amount.toLocaleString()} {o.currency} · {o.payment_status}
              </p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm uppercase tracking-widest text-sand/40 mb-2">SPYNX AI sales insights</h2>
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex gap-2">
              <button onClick={() => generateReport("keep")} disabled={genLoading} className="flex-1 border hairline hover:border-gold rounded-full py-2 text-xs disabled:opacity-50">
                {genLoading ? "Analyzing…" : "Generate report"}
              </button>
              <button
                onClick={() => generateReport("send")}
                disabled={genLoading}
                className="flex-1 bg-gold hover:bg-gold-bright text-obsidian font-semibold rounded-full py-2 text-xs disabled:opacity-50"
              >
                Send to me
              </button>
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin">
              {reports.length === 0 && <p className="text-sand/50 text-xs">No reports yet — generate one above.</p>}
              {reports.map((r) => (
                <div key={r.id} className="border hairline rounded-lg p-3 text-xs text-sand/80 whitespace-pre-wrap">
                  <p className="text-sand/40 mb-1">{new Date(r.created_at).toLocaleString()}</p>
                  {r.summary}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {payTarget && (
        <CommissionModal
          listing={payTarget}
          commission={{ amount: payTarget.commission_amount, currency: payTarget.currency, momo_number: "see backend/.env", momo_name: "SPYNXcomerce" }}
          onClose={() => setPayTarget(null)}
          onPublished={() => {
            setPayTarget(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
