import fetch from "node-fetch";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "SPYNXcomerce <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, textFallback }) {
  if (!RESEND_API_KEY) {
    console.log("\n📧 (Demo mode — no RESEND_API_KEY set) Would send email:");
    console.log(`   To: ${to}\n   Subject: ${subject}`);
    if (textFallback) console.log(`   ${textFallback}`);
    return { demo: true };
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.message || "Failed to send email");
  return { demo: false, id: data.id };
}

export function verificationEmailHtml({ name, verifyUrl }) {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background:#0B0E14; color:#EDE6D6;">
    <p style="font-size:28px; letter-spacing:2px; color:#D4AF37; margin-bottom:0;">SPYNX</p>
    <h1 style="color:#D4AF37; font-size:20px;">Welcome to SPYNXcomerce, ${name}</h1>
    <p>Confirm your email to buy, sell, and pay on SPYNXcomerce — phones, computers, accessories, and electronics.</p>
    <a href="${verifyUrl}" style="display:inline-block; margin-top:16px; background:#D4AF37; color:#0B0E14; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:999px;">
      Verify my email
    </a>
    <p style="font-size:12px; color:#8a8a8a; margin-top:24px;">If the button doesn't work, copy this link into your browser:<br>${verifyUrl}</p>
  </div>`;
}
