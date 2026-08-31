import pg from "pg";

const { Pool } = pg;

// Be forgiving about how DATABASE_URL got into the environment — strip accidental
// wrapping quotes and whitespace, which is the #1 cause of "DATABASE_URL is not set"
// style errors when people paste a connection string from a dashboard.
function cleanConnectionString(raw) {
  if (!raw) return raw;
  let s = raw.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

const DATABASE_URL = cleanConnectionString(process.env.DATABASE_URL);

if (!DATABASE_URL) {
  console.error(
    "\n❌ DATABASE_URL is not set (or is empty after trimming).\n" +
      "   SPYNXcomerce runs on Postgres — Neon (https://neon.tech) has a free tier.\n" +
      "   1. Create a project at neon.tech and copy its connection string.\n" +
      "   2. Open backend/.env and set DATABASE_URL=<paste it here, no quotes>.\n" +
      "   3. Fully stop and restart the server (env files are not hot-reloaded).\n" +
      "   Run `grep DATABASE_URL backend/.env` to confirm the value actually saved.\n"
  );
  process.exit(1);
}

if (!DATABASE_URL.startsWith("postgres://") && !DATABASE_URL.startsWith("postgresql://")) {
  console.error(
    `\n❌ DATABASE_URL doesn't look like a Postgres connection string (got: "${DATABASE_URL.slice(0, 20)}...").\n` +
      "   It should start with postgresql:// — copy it fresh from your Neon dashboard.\n"
  );
  process.exit(1);
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

// Thin shim so the rest of the codebase can use the familiar
// `db.prepare(sql).get(...)/.all(...)/.run(...)` pattern, just awaited.
// SQL below uses "?" placeholders; converted to Postgres's "$1, $2..." here.
function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export const db = {
  prepare(sql) {
    const pgSql = toPgSql(sql);
    return {
      get: async (...params) => {
        const res = await pool.query(pgSql, params);
        return res.rows[0];
      },
      all: async (...params) => {
        const res = await pool.query(pgSql, params);
        return res.rows;
      },
      run: async (...params) => {
        const res = await pool.query(pgSql, params);
        return { changes: res.rowCount, rows: res.rows };
      },
    };
  },
};

export function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      momo_number TEXT,
      role TEXT DEFAULT 'both',
      avatar TEXT,
      background_url TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      address TEXT,
      language TEXT DEFAULT 'en',
      email_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      verification_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      description TEXT,
      price DOUBLE PRECISION NOT NULL,
      currency TEXT DEFAULT 'GHS',
      location TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      images TEXT DEFAULT '[]',
      attributes TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending_commission',
      commission_amount DOUBLE PRECISION DEFAULT 0,
      commission_paid INTEGER DEFAULT 0,
      commission_ref TEXT,
      views INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL,
      buyer_fee DOUBLE PRECISION DEFAULT 0,
      currency TEXT DEFAULT 'GHS',
      payment_provider TEXT,
      payment_ref TEXT,
      payment_status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ai_reports (
      id TEXT PRIMARY KEY,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      summary TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
    CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
    CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, recipient_id);
  `);

  // Forward-compatible migration for databases created by an earlier version.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS background_url TEXT`);

  console.log("✅ Database schema ready (Postgres/Neon)");
}
