import fetch from "node-fetch";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// SPYNX AI can rotate across up to three Google AI Studio API keys — useful for
// spreading load across free-tier rate limits, or as automatic failover if one
// key is exhausted/invalid. Any of these that are unset are simply skipped.
const KEYS = [process.env.GOOGLE_API_KEY, process.env.GOOGLE_API_KEY_2, process.env.GOOGLE_API_KEY_3].filter(Boolean);

function endpointFor(key) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
}

/**
 * Calls Google AI Studio (Gemini) generateContent, trying each configured key
 * in order until one succeeds. `parts` is an array of Gemini "part" objects:
 * { text } or { inline_data: { mime_type, data(base64) } }
 */
export async function generateContent({ systemInstruction, parts, temperature = 0.6 }) {
  if (KEYS.length === 0) {
    return {
      demo: true,
      text:
        "🤖 (Demo mode) SPYNX AI isn't fully connected yet — add a free Google AI Studio key as GOOGLE_API_KEY " +
        "in backend/.env to enable real product analysis, sales insights, and multimodal file understanding. " +
        "You can add up to three keys (GOOGLE_API_KEY, GOOGLE_API_KEY_2, GOOGLE_API_KEY_3) for automatic failover. " +
        "Get a free key at https://aistudio.google.com/app/apikey.",
    };
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { temperature },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  let lastError;
  for (let i = 0; i < KEYS.length; i++) {
    try {
      const resp = await fetch(endpointFor(KEYS[i]), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message || "Gemini request failed");

      const text =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("\n") ||
        "I couldn't generate a response for that — please try rephrasing.";
      return { demo: false, text, keyIndex: i };
    } catch (err) {
      lastError = err;
      console.warn(`SPYNX AI: key #${i + 1} failed (${err.message}), ${i < KEYS.length - 1 ? "trying next key…" : "no keys left."}`);
    }
  }
  throw lastError || new Error("All configured Gemini API keys failed.");
}
