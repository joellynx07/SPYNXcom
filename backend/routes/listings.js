import { Router } from "express";
import { db, uid } from "../db.js";
import { requireAuth, requireVerified, optionalAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// SPYNXcomerce: phones, computers, their accessories, and general electronics/gadgets only.
export const ALLOWED_CATEGORIES = ["phone", "phone_accessory", "computer", "computer_accessory", "electronics"];
export const CATEGORY_LABELS = {
  phone: "Phone",
  phone_accessory: "Phone Accessory",
  computer: "Computer / Laptop",
  computer_accessory: "Computer Accessory",
  electronics: "Electronics & Gadgets",
};

function commissionFor(price) {
  const pct = Number(process.env.COMMISSION_PERCENT || 5);
  return Math.round(price * (pct / 100) * 100) / 100;
}

router.get("/", async (req, res) => {
  const { q, category, subcategory, minPrice, maxPrice, status = "active", minLat, maxLat, minLng, maxLng } = req.query;
  let sql = "SELECT listings.*, users.name as seller_name FROM listings JOIN users ON users.id = listings.seller_id WHERE listings.status = ?";
  const params = [status];
  if (q) {
    sql += " AND (title ILIKE ? OR description ILIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (subcategory) {
    sql += " AND subcategory = ?";
    params.push(subcategory);
  }
  if (minPrice) {
    sql += " AND price >= ?";
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    sql += " AND price <= ?";
    params.push(Number(maxPrice));
  }
  if (minLat && maxLat && minLng && maxLng) {
    sql += " AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?";
    params.push(Number(minLat), Number(maxLat), Number(minLng), Number(maxLng));
  }
  sql += " ORDER BY created_at DESC";
  const rows = await db.prepare(sql).all(...params);
  res.json(rows.map(serialize));
});

router.get("/mine", requireAuth, async (req, res) => {
  const rows = await db.prepare("SELECT * FROM listings WHERE seller_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(rows.map(serialize));
});

router.get("/:id", optionalAuth, async (req, res) => {
  const row = await db
    .prepare(
      `SELECT listings.*, users.name as seller_name, users.momo_number as seller_momo, users.phone as seller_phone
       FROM listings JOIN users ON users.id = listings.seller_id WHERE listings.id = ?`
    )
    .get(req.params.id);
  if (!row) return res.status(404).json({ error: "Listing not found." });
  await db.prepare("UPDATE listings SET views = views + 1 WHERE id = ?").run(req.params.id);
  res.json(serialize(row));
});

router.post("/", requireAuth, requireVerified, upload.array("images", 8), async (req, res) => {
  const { title, category, subcategory, description, price, currency, location, lat, lng, attributes } = req.body;
  if (!title || !category || !price) {
    return res.status(400).json({ error: "Title, category and price are required." });
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "SPYNXcomerce only accepts phones, computers, their accessories, and electronics/gadgets." });
  }

  const id = uid("lst_");
  const images = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const commission = commissionFor(Number(price));

  await db
    .prepare(
      `INSERT INTO listings (id, seller_id, title, category, subcategory, description, price, currency, location, lat, lng, images, attributes, status, commission_amount)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      id,
      req.user.id,
      title,
      category,
      subcategory || null,
      description || "",
      Number(price),
      currency || "GHS",
      location || "",
      lat || null,
      lng || null,
      JSON.stringify(images),
      attributes || "{}",
      "pending_commission",
      commission
    );

  const row = await db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
  res.json({
    listing: serialize(row),
    commission: {
      amount: commission,
      currency: currency || "GHS",
      momo_number: process.env.COMMISSION_MOMO_NUMBER,
      momo_name: process.env.COMMISSION_MOMO_NAME,
      message: "Your listing is saved as a draft. Pay the commission below to publish it live to buyers.",
    },
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const row = await db.prepare("SELECT * FROM listings WHERE id = ?").get(req.params.id);
  if (!row || row.seller_id !== req.user.id) return res.status(404).json({ error: "Listing not found." });
  await db.prepare("DELETE FROM listings WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

function serialize(row) {
  return {
    ...row,
    images: JSON.parse(row.images || "[]"),
    attributes: JSON.parse(row.attributes || "{}"),
    commission_paid: !!row.commission_paid,
  };
}

export default router;
