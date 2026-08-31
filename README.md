# SPYNX · SPYNXcomerce

A specialist marketplace for **phones, computers, their accessories, and electronics/gadgets only**
— nothing else is accepted. Sellers and buyers share their location and see each other on a live
map, every account is verified by email before it can list or pay, buyers and sellers can message
each other (or jump straight to WhatsApp or a phone call), the whole app runs in English, Twi, or
French, an AI assistant you can summon just by saying its name reads pages aloud in your chosen
language, and everyone can personalize their own theme and background image from Settings.

Built as a real, working, deploy-ready product — 100% Node.js on the backend.

## What's inside

- **Backend:** Node.js + Express + **Postgres (Neon-ready)** — auth with email verification,
  geolocation-aware listings, orders, payments, direct messaging, AI
- **Frontend:** React + Vite + Tailwind — a fully themeable UI (**7 switchable themes** plus a
  user-uploadable custom background), splash screen with your SPYNX logo, live map
  (Leaflet/OpenStreetMap, no API key needed), full English/Twi/French translation layer
- **Voice assistant:** say **"Spynx"** out loud, it asks which language you want (English, Twi, or
  French), then reads each page aloud as you browse and announces what you click — built on the
  browser's native Web Speech API, no extra service required
- **AI:** Google AI Studio (Gemini) — free tier, and you can configure **up to three API keys**
  (`GOOGLE_API_KEY`, `GOOGLE_API_KEY_2`, `GOOGLE_API_KEY_3`) with automatic failover between them.
  Specializes in phones/computers/electronics: spec comparisons, condition red flags, fair pricing,
  multimodal file analysis (images, audio, video, PDF, Word, Excel, PowerPoint), replies in the
  user's chosen language
- **Messaging:** buyers and sellers chat directly from any listing, plus one-tap **WhatsApp** and
  **Call** buttons using the seller's phone number
- **Email verification:** Resend (free tier) — every new signup gets a verification link; listing
  and paying are blocked until verified
- **Payments:** Paystack (Mobile Money + cards, best for Ghana/Africa) and Stripe (international
  cards), paid entirely on-site through popups — buyer and seller both choose their method
- **Settings panel:** theme, language, custom background image, profile (name/phone/MoMo number),
  location, and email verification — all in one place
- **Deployment:** one-click Render Blueprint (`render.yaml`) for both services, plus Docker/Compose
  and split-hosting instructions for any other host

> This is a real, runnable product, not a mockup. Every button calls a real API. It ships in
> **demo mode** by default (no email/payment/AI keys needed to click through the whole flow — the
> verification link is even shown directly on-screen when no email provider is configured), and
> becomes fully live the moment you add your own free/paid API keys below. I tested the full flow
> (register → verify → list → pay commission → buy → message → background upload) against a real
> Postgres database before shipping this.

---

## 0. What's restricted, on purpose

SPYNXcomerce only accepts five categories — **Phones, Phone Accessories, Computers/Laptops,
Computer Accessories, and Electronics & Gadgets** (TVs, headphones, smartwatches, cameras, drones,
consoles, and similar) — enforced server-side in `backend/routes/listings.js`
(`ALLOWED_CATEGORIES`). Anything else is rejected with a clear error, by design.

---

## 1. Project structure

```
spynxcommerce/
├── backend/             Express API, Postgres (Neon), uploads, AI/email/payment integrations
├── frontend/             React app — themes, i18n, voice assistant, messaging, map, settings
│   └── public/spynx-logo.png   Your logo, background removed
├── render.yaml            One-click Render Blueprint (deploys both services)
├── docker-compose.yml     One-command local/production run for any other host
├── nginx.example.conf     Reference config for a single-domain production deploy
```

---

## 2. Get a free database (2 minutes) — do this first

SPYNXcomerce runs on Postgres. [Neon](https://neon.tech) has a generous free tier and is the
recommended host — **the backend will not start without a working `DATABASE_URL`.**

1. Sign up at https://neon.tech and create a new project.
2. Copy the **connection string** it shows you (starts with `postgresql://...`, ends with
   `?sslmode=require`).
3. Paste it into `backend/.env` as `DATABASE_URL=...` — **no quotes, no trailing spaces.**
4. Fully stop and restart the server after editing `.env` — environment files are not hot-reloaded,
   even under `npm run dev`'s watch mode.

If you ever see "DATABASE_URL is not set" after adding it, run
`grep DATABASE_URL backend/.env` to confirm the value actually saved to the file, and make sure
you're running `npm run dev` from inside a terminal where you just restarted the process (not an
old tab that started before you edited the file).

The backend creates all its own tables automatically on first boot — no separate migration step.

---

## 3. Run it locally (5 minutes)

You need [Node.js 20+](https://nodejs.org).

### Backend
```bash
cd backend
cp .env.example .env      # then paste your Neon DATABASE_URL in, plus any other keys you have
npm install
npm run dev                # http://localhost:4000
```

### Frontend (second terminal)
```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to the backend automatically.

**Try it end-to-end right away, even with just a database and zero other keys:**
1. Sign up — location capture included (GPS button or click the map).
2. "Check your email" screen shows the verification link directly (dev-mode convenience since no
   email provider is set yet) — click it.
3. **Sell → List a device** — pick a category (phones, computers, accessories, or electronics),
   fill in specs, set a location, publish.
4. Commission popup appears — pick "Mobile Money"; demo mode completes it instantly. Listing goes
   live.
5. Visit **Map** — your listing shows up as a pin.
6. Sign up as a second (buyer) account, verify it, open the listing — **Buy now**, **Message
   seller**, or jump straight to **WhatsApp**/**Call** if the seller added a phone number.
7. Type **"Spynx, is this a good deal?"** into the search bar — SPYNX AI opens and answers. Upload
   a photo/PDF for it to analyze too.
8. Click the 🎤 button bottom-left, say **"Spynx"** out loud, then say **"English"**, **"Twi"**, or
   **"French"** when asked — the site switches language and starts reading pages aloud as you
   browse. (Needs Chrome or Edge and microphone permission — see section 6.)
9. Go to **Settings** — switch between 7 themes, upload a custom background image, edit your
   profile, and manage everything else in one place.

---

## 4. Connect real services

Everything below is optional except the database — the app runs and demos fully without any of it.

### Email verification — Resend, free
```
RESEND_API_KEY=re_...
EMAIL_FROM=SPYNXcomerce <onboarding@resend.dev>
```
Get a key at https://resend.com/api-keys. The shared `onboarding@resend.dev` sender works
immediately for testing; verify your own domain before production so emails don't land in spam.

### AI assistant — Google AI Studio (Gemini), free, up to 3 keys
```
GOOGLE_API_KEY=your_first_key
GOOGLE_API_KEY_2=your_second_key   # optional
GOOGLE_API_KEY_3=your_third_key    # optional
GEMINI_MODEL=gemini-2.0-flash
```
Get free keys at https://aistudio.google.com/app/apikey. Only the first is required — the others
are automatic failover: if a key errors out or hits a rate limit, SPYNX AI immediately retries the
next one (`backend/ai/gemini.js`). This is useful for spreading load across multiple free-tier
quotas, or just for resilience.

### Payments — Paystack (Mobile Money + cards, Ghana/Africa)
```
PAYSTACK_SECRET_KEY=sk_...
PAYSTACK_PUBLIC_KEY=pk_...
```
From https://dashboard.paystack.com → Settings → API Keys & Webhooks. Add a webhook pointing to
`https://your-domain.com/api/payments/webhook/paystack` so payments confirm automatically even if
the buyer closes the tab.

### Payments — Stripe (international cards)
```
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLIC_KEY=pk_...
```
From https://dashboard.stripe.com/apikeys.

### Commission & business settings
```
COMMISSION_MOMO_NUMBER=0244000000
COMMISSION_MOMO_NAME=SPYNXcomerce Ltd
COMMISSION_PERCENT=5
BUYER_SERVICE_FEE_PERCENT=2
```

### "I already sent it manually" flow
Both the commission and buyer payment popups include a **"Direct Mobile Money"** option for people
who prefer to transfer by hand. These are marked "pending verification" — confirm them via:
```
POST /api/payments/verify-manual/commission/:listingId
POST /api/payments/verify-manual/order/:orderId
```

---

## 5. Deploy to Render (recommended — one click)

This repo includes `render.yaml`, deploying **both** services in one go.

1. Push this repo to GitHub.
2. In [Render](https://dashboard.render.com), **New → Blueprint**, point it at your repo.
3. Render prompts for the vars marked `sync: false` — at minimum set `DATABASE_URL` (your Neon
   string) on the backend, then once both services are live, set `CLIENT_URL` on the backend and
   `VITE_API_BASE` on the frontend to each other's Render URLs (see comments in `render.yaml`).
4. Redeploy the frontend once after setting `VITE_API_BASE` (static-site env vars are baked in at
   build time on Render).

**About uploaded photos/backgrounds on Render's free tier:** persistent disks require a paid
instance type. On the free tier, uploaded images are lost on restart — fine for demoing, but move
to object storage (see "Going worldwide") before real users arrive.

If you'd rather configure by hand: a **Web Service** for `backend/` (`npm install` / `npm start`)
and a **Static Site** for `frontend/` (`npm install && npm run build`, publish dir `dist`).

---

## 6. The voice assistant — how it works, and its limits

`frontend/src/VoiceContext.jsx` uses the browser's native **Web Speech API** — no third-party
voice service, nothing to configure.

**Flow:** click the 🎤 button (bottom-left) once to grant microphone permission and start listening
in the background. Say **"Spynx"** any time — it asks which language you want, listens for your
answer (English / Twi / French), switches the whole UI, and starts reading each page aloud as you
navigate, plus briefly announcing whatever button or link you click.

**Honest limitations:**
- Reliable only in **Chrome and Edge** (desktop and Android). Safari and Firefox have partial/no
  support for `SpeechRecognition` — the mic button simply doesn't render if the browser can't
  support it, so nothing breaks, it's just unavailable there.
- Requires **HTTPS in production** (or `localhost` for dev) — browsers block microphone access on
  plain HTTP.
- There's no standard **Twi voice** in most browsers' text-to-speech engines, so Twi pages are read
  using an English-voice pronunciation of the Twi text — understandable but not native-sounding.
  If a browser/OS combination does have a Twi or Akan voice installed, it'll be used automatically.
- Page reading is generic (reads the page's `<h1>` and first `<p>`), not hand-written per page — it
  works everywhere without extra wiring, but the phrasing is simple by design.

---

## 7. Deploy elsewhere (Docker Compose, any VPS)

```bash
git clone <your-repo-url> spynxcommerce
cd spynxcommerce
cp backend/.env.example backend/.env   # fill in your real keys, including DATABASE_URL
docker compose up -d --build
```
Backend on port 4000, frontend on port 5173. Put a reverse proxy in front for one domain (see
`nginx.example.conf`), or use Caddy for automatic free HTTPS:
```
your-domain.com {
    reverse_proxy /api/* backend:4000
    reverse_proxy /uploads/* backend:4000
    reverse_proxy /* frontend:5173
}
```

### Split hosting (no server to manage)
- **Frontend** → [Vercel](https://vercel.com)/[Netlify](https://netlify.com), build env var
  `VITE_API_BASE=https://your-backend-url.com/api`.
- **Backend** → [Render](https://render.com)/[Railway](https://railway.app)/[Fly.io](https://fly.io),
  same `.env` vars in their dashboard.

---

## 8. Going worldwide

1. **Domain & HTTPS** — required for payments, voice control, and app-store listings.
2. **Object storage for photos & backgrounds** — move `backend/uploads` to Cloudflare R2, S3, or
   Backblaze B2 fronted by a CDN; required on Render's free tier since local disk isn't persistent.
3. **Multi-currency & multi-country payments** — Paystack covers Ghana, Nigeria, South Africa,
   Kenya; Stripe covers the rest.
4. **Search at scale** — Postgres `ILIKE` search works to thousands of listings; beyond that, add
   Meilisearch or Typesense.
5. **Mobile apps** — wrap the React frontend with [Capacitor](https://capacitorjs.com).
6. **Trust & safety** — seller ID verification, ratings, dispute/refund flow, AI content moderation
   on listing photos (Gemini can do this too).
7. **Real-time messaging** — current inbox polls every few seconds; swap in Socket.IO or
   Pusher/Ably for instant delivery and typing indicators.
8. **More languages** — `frontend/src/i18n.js` is a flat dictionary; copy the `en` block, translate
   it, add it to `LANGUAGES`, and extend the allow-list in `backend/routes/auth.js` and the
   `SPEECH_LANG_CODE` map in `VoiceContext.jsx`.
9. **Notifications** — Resend/Twilio for order and message alerts.
10. **Analytics** — [PostHog](https://posthog.com) (self-hostable, generous free tier).
11. **SEO** — add per-listing meta tags (title/description/og:image) so shared links preview nicely
    on WhatsApp, which is how most Tonaton-style traffic spreads in Ghana.

---

## 9. What's implemented vs. next steps

**Fully implemented and tested end-to-end (including live against Postgres):**
- Registration/login/JWT sessions, email verification with on-screen dev-mode fallback
- Seller & buyer location capture, live map (Leaflet, no API key)
- Listings restricted to phones/computers/accessories/electronics, with rich category-specific spec
  fields, seller phone exposed for buyer contact
- Direct messaging between buyers and sellers, plus one-tap **WhatsApp** and **Call** buttons
- Seller commission popup and buyer payment popup, both with Mobile Money / card / Stripe / manual
  transfer options
- SPYNX AI: chat, file analysis (images/audio/video/PDF/Office docs), sales reports, multilingual
  replies, up to 3 API keys with automatic failover, summonable by typing "Spynx"
- **Voice assistant**: wake word, spoken language selection, page-reading, click announcements
- 7-theme switcher plus **user-uploadable custom background image**
- English/Twi/French UI across navigation, home, auth, listings, payments, messages, AI, settings
- Unified **Settings** page: profile, verification, location, language, theme, background
- Postgres/Neon with automatic schema creation, hardened `DATABASE_URL` parsing (strips accidental
  quotes/whitespace, gives a specific error instead of failing silently)
- Render Blueprint, Docker/Compose, split-hosting instructions

**Clearly marked next steps:**
- Real Stripe webhook handler (Paystack's is implemented; Stripe needs the same pattern added)
- Emailing/SMS-ing the AI sales report (the route already returns the text — pipe into Resend/Twilio)
- Real-time messaging via WebSockets instead of polling
- Admin approval queue for manual Mobile Money confirmations
- Ratings/reviews and dispute handling
- Native Twi text-to-speech voice (depends on browser/OS voice packs, not something this app controls)

---

## 10. Environment variables reference (`backend/.env`)

| Variable | Purpose | Required to run in demo mode? |
|---|---|---|
| `DATABASE_URL` | Postgres connection string (Neon recommended) | **Yes — backend won't start without it** |
| `PORT` | Backend port | No, defaults to 4000 |
| `JWT_SECRET` | Signs login sessions | No, but set a real random string before production |
| `CLIENT_URL` | Used for payment/email redirect URLs | No |
| `GOOGLE_API_KEY` / `_2` / `_3` | AI responses, with automatic failover across up to 3 keys | No — AI replies with a demo message until at least one is set |
| `GEMINI_MODEL` | Which Gemini model to call | No, defaults to `gemini-2.0-flash` |
| `RESEND_API_KEY` | Real verification emails | No — link shown on-screen in dev mode until set |
| `EMAIL_FROM` | Sender address | No |
| `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` | Real Mobile Money + card charges | No — auto-completes in demo mode until set |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLIC_KEY` | Real international card charges | No |
| `COMMISSION_MOMO_NUMBER` / `COMMISSION_MOMO_NAME` | Shown for manual commission transfers | No |
| `COMMISSION_PERCENT` | Seller commission rate | No, defaults to 5% |
| `BUYER_SERVICE_FEE_PERCENT` | Buyer-side fee | No, defaults to 2% |

---

Questions, or want a specific piece wired up next (Stripe webhook, real-time chat, an admin panel)?
Just ask — the codebase is organized so each feature lives in one clearly-named file.
