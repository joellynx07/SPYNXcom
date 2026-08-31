import { Router } from "express";
import { db, uid } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/threads", requireAuth, async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT
         CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS other_id,
         MAX(created_at) AS last_at
       FROM messages
       WHERE sender_id = ? OR recipient_id = ?
       GROUP BY other_id
       ORDER BY last_at DESC`
    )
    .all(req.user.id, req.user.id, req.user.id);

  const threads = [];
  for (const r of rows) {
    const other = await db.prepare("SELECT id, name, phone FROM users WHERE id = ?").get(r.other_id);
    const last = await db
      .prepare(
        `SELECT * FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(req.user.id, r.other_id, r.other_id, req.user.id);
    const unread = await db
      .prepare("SELECT COUNT(*) as c FROM messages WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL")
      .get(r.other_id, req.user.id);
    threads.push({
      userId: r.other_id,
      userName: other?.name || "Unknown user",
      userPhone: other?.phone || null,
      lastMessage: last?.body,
      lastAt: last?.created_at,
      unread: Number(unread?.c || 0),
    });
  }
  res.json(threads);
});

router.get("/thread/:userId", requireAuth, async (req, res) => {
  const rows = await db
    .prepare(
      `SELECT messages.*, u.name as sender_name FROM messages
       JOIN users u ON u.id = messages.sender_id
       WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
       ORDER BY created_at ASC`
    )
    .all(req.user.id, req.params.userId, req.params.userId, req.user.id);

  await db.prepare("UPDATE messages SET read_at = NOW() WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL").run(req.params.userId, req.user.id);

  res.json(rows);
});

router.post("/", requireAuth, async (req, res) => {
  const { recipientId, body, listingId } = req.body;
  if (!recipientId || !body?.trim()) return res.status(400).json({ error: "A recipient and message body are required." });
  if (recipientId === req.user.id) return res.status(400).json({ error: "You can't message yourself." });

  const recipient = await db.prepare("SELECT id FROM users WHERE id = ?").get(recipientId);
  if (!recipient) return res.status(404).json({ error: "Recipient not found." });

  const id = uid("msg_");
  await db.prepare(`INSERT INTO messages (id, listing_id, sender_id, recipient_id, body) VALUES (?,?,?,?,?)`).run(id, listingId || null, req.user.id, recipientId, body.trim());

  const row = await db.prepare("SELECT * FROM messages WHERE id = ?").get(id);
  res.json(row);
});

router.get("/unread-count", requireAuth, async (req, res) => {
  const row = await db.prepare("SELECT COUNT(*) as c FROM messages WHERE recipient_id = ? AND read_at IS NULL").get(req.user.id);
  res.json({ count: Number(row?.c || 0) });
});

export default router;
