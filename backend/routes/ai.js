import { Router } from "express";
import { db, uid } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { generateContent } from "../ai/gemini.js";
import { fileToGeminiParts } from "../ai/extract.js";

const router = Router();

const LANGUAGE_NAMES = { en: "English", tw: "Twi (Akan)", fr: "French" };

const SYSTEM_PROMPT = `You are SPYNX AI, the built-in shopping and selling assistant for SPYNXcomerce — a specialist marketplace
for phones, phone accessories, computers/laptops, computer accessories, and general electronics & gadgets ONLY (no cars,
real estate, clothing, or other unrelated goods). You help buyers evaluate a device before they buy: check whether the
price is fair for its specs, spot red flags in a listing or a photo (screen cracks, battery health claims, missing
accessories, mismatched model numbers), compare two devices, and explain technical specs (RAM, storage, processor,
refresh rate, battery cycles, etc.) in plain language. You help sellers write accurate, compelling listings, price
competitively against the current market, and understand their sales performance. Be concise, practical, and honest —
flag scams, unrealistic prices, or vague listings when you see them. Use Ghanaian Cedi (GHS) by default unless another
currency is specified. Never invent facts about a specific real listing you have not been given data on. If asked about
anything outside electronics/gadgets or the marketplace itself, politely note that SPYNXcomerce only deals in phones,
computers, their accessories, and electronics/gadgets, and redirect the conversation back to that.`;

function withLanguage(basePrompt, language) {
  const name = LANGUAGE_NAMES[language];
  if (!name || language === "en") return basePrompt;
  return `${basePrompt}\n\nIMPORTANT: Reply entirely in ${name}, naturally and fluently, regardless of what language the user writes in — unless they explicitly ask you to switch languages.`;
}

router.post("/chat", requireAuth, async (req, res) => {
  const { message, history = [], listingId, language = "en" } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required." });

  let context = "";
  if (listingId) {
    const listing = await db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
    if (listing) {
      context = `\n\nThe user is looking at this listing:\nTitle: ${listing.title}\nCategory: ${listing.category}\nPrice: ${listing.price} ${listing.currency}\nLocation: ${listing.location}\nDescription: ${listing.description}\n`;
    }
  }

  const parts = [
    ...history.slice(-10).map((h) => ({ text: `${h.role === "user" ? "User" : "Assistant"}: ${h.content}` })),
    { text: `${context}\nUser: ${message}` },
  ];

  try {
    const result = await generateContent({ systemInstruction: withLanguage(SYSTEM_PROMPT, language), parts });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/analyze-file", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded." });
  const { prompt, language = "en" } = req.body;

  try {
    const fileParts = await fileToGeminiParts(req.file.path, req.file.mimetype, req.file.originalname);
    const instruction =
      prompt ||
      "Analyze this file for an electronics marketplace listing (phones, computers, accessories, or gadgets). If it's a product photo or video, identify the device (brand, model if visible), assess its visible condition, note any red flags (cracks, wear, missing parts), and suggest a fair price range and a compelling listing title/description. If it's a document/spreadsheet/slides/receipt, summarize the key information relevant to buying or selling a device.";

    const result = await generateContent({
      systemInstruction: withLanguage(SYSTEM_PROMPT, language),
      parts: [{ text: instruction }, ...fileParts],
    });
    res.json({ ...result, filename: req.file.originalname, url: `/uploads/${req.file.filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sales-report", requireAuth, async (req, res) => {
  const { action = "keep", language = "en" } = req.body;
  const listings = await db.prepare("SELECT * FROM listings WHERE seller_id = ?").all(req.user.id);
  const orders = await db
    .prepare(`SELECT orders.*, listings.title FROM orders JOIN listings ON listings.id = orders.listing_id WHERE orders.seller_id = ?`)
    .all(req.user.id);

  const totalRevenue = orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.amount, 0);
  const dataSummary = `
Seller: ${req.user.name}
Total listings: ${listings.length} (active: ${listings.filter((l) => l.status === "active").length})
Total orders: ${orders.length} (paid: ${orders.filter((o) => o.payment_status === "paid").length})
Total revenue (paid orders): ${totalRevenue}
Top listings by views: ${listings.sort((a, b) => b.views - a.views).slice(0, 5).map((l) => `${l.title} (${l.views} views)`).join(", ") || "none yet"}
Order details: ${orders.map((o) => `${o.title}: ${o.amount} ${o.currency} [${o.payment_status}]`).join("; ") || "none yet"}
`;

  try {
    const result = await generateContent({
      systemInstruction: withLanguage(SYSTEM_PROMPT, language),
      parts: [
        {
          text: `Write a short, friendly sales performance report for this seller based on their data below. Include: a 1-line headline, 3-4 key insights, and 2-3 concrete suggestions to sell more. Keep it under 250 words.\n\n${dataSummary}`,
        },
      ],
    });

    const id = uid("rpt_");
    await db.prepare("INSERT INTO ai_reports (id, seller_id, summary) VALUES (?,?,?)").run(id, req.user.id, result.text);

    res.json({
      ...result,
      id,
      action,
      note:
        action === "send"
          ? "Report generated and saved. To actually email/SMS this automatically, connect an email provider (e.g. Resend, SendGrid) in backend/routes/ai.js."
          : "Report generated and saved to your seller dashboard.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/reports", requireAuth, async (req, res) => {
  const rows = await db.prepare("SELECT * FROM ai_reports WHERE seller_id = ? ORDER BY created_at DESC").all(req.user.id);
  res.json(rows);
});

export default router;
