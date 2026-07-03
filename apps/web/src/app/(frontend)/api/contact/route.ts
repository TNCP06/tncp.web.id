import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX = { name: 100, email: 200, message: 5000 };

const hits = new Map<string, { count: number; timestamp: number }>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    // Real client IP. Behind the Cloudflare Tunnel, x-forwarded-for is the CF
    // edge IP (shared by everyone) — cf-connecting-ip is the actual visitor.
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown";
    const now = Date.now();

    // Evict stale entries so the map can't grow unbounded (one IP = one entry
    // forever, otherwise). Cheap sweep, only when it gets large.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now - v.timestamp > WINDOW_MS) hits.delete(k);
    }

    const entry = hits.get(ip);
    if (entry && now - entry.timestamp < WINDOW_MS) {
      if (entry.count >= RATE_LIMIT) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
      entry.count++;
    } else {
      hits.set(ip, { count: 1, timestamp: now });
    }

    // Parse & validate
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, email, message, website } = body as Record<string, unknown>;

    // Honeypot: real users never see or fill `website`. Pretend success and
    // drop it, so bots don't learn they were caught.
    if (typeof website === "string" && website.trim()) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (
      typeof name !== "string" || !name.trim() ||
      typeof email !== "string" || !email.trim() ||
      typeof message !== "string" || !message.trim()
    ) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
      return NextResponse.json({ error: "Field too long" }, { status: 400 });
    }

    // Create message (afterChange hook notifies the owner over email + Telegram)
    const payload = await getPayload({ config });
    await payload.create({
      collection: "messages",
      data: { name: name.trim(), email: email.trim(), message: message.trim() },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
