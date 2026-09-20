import { NextResponse } from "next/server";
import { BUSINESS_CONTEXT } from "@/lib/chat-context";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY = 12;

/** Garde-fou anti-abus : limite par IP, en mémoire de l'instance. */
const RATE_LIMIT = { windowMs: 60_000, max: 12 };
const hits = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (!times.some((time) => now - time < RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT.max;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitize(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((item): item is ChatMessage => {
      const role = (item as ChatMessage)?.role;
      return (
        (role === "user" || role === "assistant") && typeof (item as ChatMessage)?.content === "string"
      );
    })
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY);
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Assistant indisponible pour le moment." }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Vous allez un peu vite. Patientez quelques instants avant de réessayer." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const messages = sanitize(body?.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  }

  try {
    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
        temperature: 0.4,
        max_tokens: 320,
        messages: [{ role: "system", content: BUSINESS_CONTEXT }, ...messages],
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("OpenAI a refusé la requête", response.status, detail.slice(0, 300));
      return NextResponse.json({ error: "L’assistant ne répond pas pour l’instant." }, { status: 502 });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return NextResponse.json({ error: "Réponse vide." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "L’assistant ne répond pas pour l’instant." }, { status: 502 });
  }
}
