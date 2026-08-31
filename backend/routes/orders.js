import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/buying", requireAuth, async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT orders.*, listings.title, listings.images FROM orders
       JOIN listings ON listings.id = orders.listing_id
       WHERE orders.buyer_id = ? ORDER BY orders.created_at DESC`
    )
    .all(req.user.id);
  res.json(rows.map((r) => ({ ...r, images: JSON.parse(r.images || "[]") })));
});

router.get("/selling", requireAuth, async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT orders.*, listings.title, listings.images FROM orders
       JOIN listings ON listings.id = orders.listing_id
       WHERE orders.seller_id = ? ORDER BY orders.created_at DESC`
    )
    .all(req.user.id);
  res.json(rows.map((r) => ({ ...r, images: JSON.parse(r.images || "[]") })));
});

router.get("/:id", requireAuth, async (req, res) => {
  const row = await db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Order not found." });
  if (row.buyer_id !== req.user.id && row.seller_id !== req.user.id) {
    return res.status(403).json({ error: "Not your order." });
  }
  res.json(row);
});

export default router;
