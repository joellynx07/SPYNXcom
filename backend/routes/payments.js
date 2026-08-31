import { Router } from "express";
import fetch from "node-fetch";
import { db, uid } from "../db.js";
import { requireAuth, requireVerified } from "../middleware/auth.js";

const router = Router();

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;

async function paystackInitialize({ email, amount, currency, metadata }) {
  if (!PAYSTACK_SECRET) {
    return {
      demo: true,
      authorization_url: null,
      reference: uid("demo_ps_"),
      note: "PAYSTACK_SECRET_KEY not set — running in demo mode. Add your key in backend/.env to accept real Mobile Money & card payments.",
    };
  }
  const resp = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100),
      currency: currency || "GHS",
      channels: ["mobile_money", "card", "bank_transfer"],
      metadata,
    }),
  });
  const data = await resp.json();
  if (!data.status) throw new Error(data.message || "Paystack initialization failed");
  return { demo: false, authorization_url: data.data.authorization_url, reference: data.data.reference };
}

async function stripeCreateCheckout({ amount, currency, metadata, successUrl, cancelUrl }) {
  if (!STRIPE_SECRET) {
    return {
      demo: true,
      url: null,
      reference: uid("demo_st_"),
      note: "STRIPE_SECRET_KEY not set — running in demo mode. Add your key in backend/.env to accept real card payments.",
    };
  }
  const body = new URLSearchParams({
    "payment_method_types[0]": "card",
    "line_items[0][price_data][currency]": (currency || "usd").toLowerCase(),
    "line_items[0][price_data][product_data][name]": metadata.description || "SPYNXcomerce payment",
    "line_items[0][price_data][unit_amount]": Math.round(amount * 100),
    "line_items[0][quantity]": "1",
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  for (const [k, v] of Object.entries(metadata)) body.append(`metadata[${k}]`, String(v));

  const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return { demo: false, url: data.url, reference: data.id };
}

router.post("/commission/:listingId", requireAuth, requireVerified, async (req, res) => {
  const { provider = "paystack", payer_email, momo_number } = req.body;
  const listing = await db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.listingId);
  if (!listing || listing.seller_id !== req.user.id) return res.status(404).json({ error: "Listing not found." });
  if (listing.commission_paid) return res.json({ alreadyPaid: true });

  try {
    if (provider === "manual_momo") {
      await db.prepare("UPDATE listings SET commission_ref = ? WHERE id = ?").run(`manual:${momo_number || "unknown"}`, listing.id);
      return res.json({
        pendingManualVerification: true,
        message: "Thanks! We'll verify your Mobile Money transfer and publish your listing shortly (usually within minutes).",
      });
    }
    if (provider === "stripe") {
      const result = await stripeCreateCheckout({
        amount: listing.commission_amount,
        currency: "usd",
        metadata: { type: "commission", listingId: listing.id, description: `Commission for "${listing.title}"` },
        successUrl: `${process.env.CLIENT_URL}/seller?commission=success&listing=${listing.id}`,
        cancelUrl: `${process.env.CLIENT_URL}/seller?commission=cancelled`,
      });
      await db.prepare("UPDATE listings SET commission_ref = ? WHERE id = ?").run(result.reference, listing.id);
      if (result.demo) await markCommissionPaidDemo(listing.id);
      return res.json({ redirectUrl: result.url, demo: result.demo, note: result.note });
    }
    const result = await paystackInitialize({
      email: payer_email || req.user.email,
      amount: listing.commission_amount,
      currency: listing.currency,
      metadata: { type: "commission", listingId: listing.id },
    });
    await db.prepare("UPDATE listings SET commission_ref = ? WHERE id = ?").run(result.reference, listing.id);
    if (result.demo) await markCommissionPaidDemo(listing.id);
    return res.json({ redirectUrl: result.authorization_url, demo: result.demo, note: result.note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function markCommissionPaidDemo(listingId) {
  await db.prepare("UPDATE listings SET commission_paid = 1, status = 'active' WHERE id = ?").run(listingId);
}

router.post("/order/:listingId", requireAuth, requireVerified, async (req, res) => {
  const { provider = "paystack", payer_email } = req.body;
  const listing = await db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.listingId);
  if (!listing) return res.status(404).json({ error: "Listing not found." });
  if (listing.status !== "active") return res.status(400).json({ error: "This listing isn't available for purchase yet." });

  const feePct = Number(process.env.BUYER_SERVICE_FEE_PERCENT || 2);
  const buyerFee = Math.round(listing.price * (feePct / 100) * 100) / 100;
  const total = listing.price + buyerFee;

  const orderId = uid("ord_");
  await db
    .prepare(
      `INSERT INTO orders (id, listing_id, buyer_id, seller_id, amount, buyer_fee, currency, payment_provider, payment_status)
       VALUES (?,?,?,?,?,?,?,?,?)`
    )
    .run(orderId, listing.id, req.user.id, listing.seller_id, listing.price, buyerFee, listing.currency, provider, "pending");

  try {
    if (provider === "manual_momo") {
      await db.prepare("UPDATE orders SET payment_ref = ? WHERE id = ?").run("manual", orderId);
      return res.json({ orderId, pendingManualVerification: true, total, message: "We'll confirm your Mobile Money payment and notify the seller." });
    }
    if (provider === "stripe") {
      const result = await stripeCreateCheckout({
        amount: total,
        currency: "usd",
        metadata: { type: "order", orderId, listingId: listing.id, description: listing.title },
        successUrl: `${process.env.CLIENT_URL}/order/${orderId}?payment=success`,
        cancelUrl: `${process.env.CLIENT_URL}/order/${orderId}?payment=cancelled`,
      });
      await db.prepare("UPDATE orders SET payment_ref = ? WHERE id = ?").run(result.reference, orderId);
      if (result.demo) await markOrderPaidDemo(orderId);
      return res.json({ orderId, redirectUrl: result.url, total, demo: result.demo, note: result.note });
    }
    const result = await paystackInitialize({
      email: payer_email || req.user.email,
      amount: total,
      currency: listing.currency,
      metadata: { type: "order", orderId, listingId: listing.id },
    });
    await db.prepare("UPDATE orders SET payment_ref = ? WHERE id = ?").run(result.reference, orderId);
    if (result.demo) await markOrderPaidDemo(orderId);
    return res.json({ orderId, redirectUrl: result.authorization_url, total, demo: result.demo, note: result.note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function markOrderPaidDemo(orderId) {
  await db.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(orderId);
}

router.post("/webhook/paystack", async (req, res) => {
  const event = req.body;
  if (event?.event === "charge.success") {
    const meta = event.data.metadata || {};
    if (meta.type === "commission" && meta.listingId) {
      await db.prepare("UPDATE listings SET commission_paid = 1, status = 'active' WHERE id = ?").run(meta.listingId);
    }
    if (meta.type === "order" && meta.orderId) {
      await db.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(meta.orderId);
    }
  }
  res.sendStatus(200);
});

router.post("/verify-manual/:type/:id", requireAuth, async (req, res) => {
  if (req.params.type === "commission") {
    await db.prepare("UPDATE listings SET commission_paid = 1, status = 'active' WHERE id = ?").run(req.params.id);
  } else if (req.params.type === "order") {
    await db.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(req.params.id);
  }
  res.json({ ok: true });
});

export default router;
