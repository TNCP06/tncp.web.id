import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

// Internal target of the middleware's visitor tracking (same INGEST_SECRET so
// visits can't be forged from outside). Dedups, persists, and — via the
// VisitorLogs afterChange hook — notifies Telegram.

// ponytail: in-memory dedup. Single Node process, low traffic; a restart just
// means one extra notification per visitor. Move to the DB if that ever hurts.
const seen = new Map<string, number>();
const WINDOW_MS = 60 * 60 * 1000; // 1 notification per visitor per hour

export async function POST(req: NextRequest) {
  const secret = process.env.INGEST_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const now = Date.now();
  const key: string = body.ip || body.userAgent || "unknown";
  if (now - (seen.get(key) ?? 0) < WINDOW_MS) {
    return NextResponse.json({ deduped: true });
  }
  seen.set(key, now);
  if (seen.size > 5000) {
    for (const [k, t] of seen) if (now - t > WINDOW_MS) seen.delete(k);
  }

  const payload = await getPayload({ config });
  const doc = await payload.create({
    collection: "visitor-logs",
    data: {
      path: String(body.path).slice(0, 500),
      host: body.host === "blog" ? "blog" : "site",
      country: body.country || undefined,
      ip: body.ip || undefined,
      userAgent: body.userAgent ? String(body.userAgent).slice(0, 500) : undefined,
      referer: body.referer ? String(body.referer).slice(0, 500) : undefined,
    },
  });
  return NextResponse.json({ id: doc.id }, { status: 201 });
}
