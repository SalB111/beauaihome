import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Simple per-instance rate limit (30 req/min per IP) ───────────────
// Good enough for demo traffic. Swap for Upstash Redis when scaling.
const buckets = new Map();
const LIMIT = 30;
const WINDOW_MS = 60_000;
function rateOk(ip) {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const hits = (buckets.get(ip) || []).filter((t) => t > cutoff);
  if (hits.length >= LIMIT) {
    buckets.set(ip, hits);
    return false;
  }
  hits.push(now);
  buckets.set(ip, hits);
  return true;
}

// ── SSE streaming handler with prompt caching ────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (!rateOk(ip)) {
    return res
      .status(429)
      .json({ error: "You're going a bit fast. Please wait a moment and try again." });
  }

  const { messages, systemPrompt } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array required" });
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const send = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  try {
    // Mark the system prompt for ephemeral cache (5-min TTL).
    // Cuts input-token cost ~70% on follow-up turns within the window.
    const systemBlocks = [
      {
        type: "text",
        text:
          systemPrompt ||
          "You are B.E.A.U., a home pet rehabilitation guide. Be warm, use plain language, never diagnose, always defer to the vet.",
        cache_control: { type: "ephemeral" },
      },
    ];

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: systemBlocks,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta?.type === "text_delta"
      ) {
        send({ text: event.delta.text });
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    // Never log full prompts — could contain pet/owner PII
    console.error("[beau] stream error:", err?.message || "unknown");
    try {
      send({ error: "AI service error. Please try again in a moment." });
      res.write("data: [DONE]\n\n");
      res.end();
    } catch {
      /* connection already closed */
    }
  }
}
