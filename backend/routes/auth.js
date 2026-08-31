import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db, uid } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { sendEmail, verificationEmailHtml } from "../email.js";

const router = Router();

function sign(row) {
  return jwt.sign(
    { id: row.id, name: row.name, email: row.email, role: row.role, email_verified: !!row.email_verified },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "30d" }
  );
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    momo_number: row.momo_number,
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    language: row.language || "en",
    background_url: row.background_url,
    email_verified: !!row.email_verified,
  };
}

async function issueVerification(row) {
  const token = crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.prepare("UPDATE users SET verification_token = ?, verification_expires = ? WHERE id = ?").run(token, expires, row.id);

  const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify/${token}`;
  const result = await sendEmail({
    to: row.email,
    subject: "Verify your SPYNXcomerce account",
    html: verificationEmailHtml({ name: row.name, verifyUrl }),
    textFallback: `Verification link: ${verifyUrl}`,
  });
  return { ...result, verifyUrl };
}

router.post("/register", async (req, res) => {
  const { name, email, password, phone, momo_number, role, lat, lng, address, language } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "An account with this email already exists." });

  const id = uid("usr_");
  const hash = bcrypt.hashSync(password, 10);
  await db
    .prepare(
      `INSERT INTO users (id, name, email, password_hash, phone, momo_number, role, lat, lng, address, language)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(id, name, email, hash, phone || null, momo_number || null, role || "both", lat || null, lng || null, address || null, language || "en");

  const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  let devVerifyUrl;
  try {
    const result = await issueVerification(row);
    if (result.demo) devVerifyUrl = result.verifyUrl;
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
  }

  res.json({ token: sign(row), user: publicUser(row), devVerifyUrl });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const row = await db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  res.json({ token: sign(row), user: publicUser(row) });
});

router.get("/verify/:token", async (req, res) => {
  const row = await db.prepare("SELECT * FROM users WHERE verification_token = ?").get(req.params.token);
  if (!row) return res.status(400).json({ error: "This verification link is invalid or already used." });
  if (row.verification_expires && new Date(row.verification_expires) < new Date()) {
    return res.status(400).json({ error: "This verification link has expired. Please request a new one." });
  }
  await db.prepare("UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?").run(row.id);
  const updated = await db.prepare("SELECT * FROM users WHERE id = ?").get(row.id);
  res.json({ verified: true, token: sign(updated), user: publicUser(updated) });
});

router.post("/resend-verification", requireAuth, async (req, res) => {
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!row) return res.status(404).json({ error: "Account not found." });
  if (row.email_verified) return res.json({ alreadyVerified: true });
  try {
    const result = await issueVerification(row);
    res.json({ sent: true, devVerifyUrl: result.demo ? result.verifyUrl : undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/location", requireAuth, async (req, res) => {
  const { lat, lng, address } = req.body;
  await db.prepare("UPDATE users SET lat = ?, lng = ?, address = ? WHERE id = ?").run(lat ?? null, lng ?? null, address ?? null, req.user.id);
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(row) });
});

router.patch("/language", requireAuth, async (req, res) => {
  const { language } = req.body;
  if (!["en", "tw", "fr"].includes(language)) return res.status(400).json({ error: "Unsupported language." });
  await db.prepare("UPDATE users SET language = ? WHERE id = ?").run(language, req.user.id);
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(row) });
});

router.patch("/settings", requireAuth, async (req, res) => {
  const { name, phone, momo_number } = req.body;
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  await db
    .prepare("UPDATE users SET name = ?, phone = ?, momo_number = ? WHERE id = ?")
    .run(name ?? row.name, phone ?? row.phone, momo_number ?? row.momo_number, req.user.id);
  const updated = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(updated) });
});

// Custom site background image — lets a person personalize their SPYNXcomerce look.
router.post("/background", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded." });
  const url = `/uploads/${req.file.filename}`;
  await db.prepare("UPDATE users SET background_url = ? WHERE id = ?").run(url, req.user.id);
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(row) });
});

router.delete("/background", requireAuth, async (req, res) => {
  await db.prepare("UPDATE users SET background_url = NULL WHERE id = ?").run(req.user.id);
  const row = await db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: publicUser(row) });
});

export default router;
