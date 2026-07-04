import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

function authorized(req: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const payload = await getPayload({ config });
  const doc = await payload.update({ collection: "articles", id, data: { _status: "published" } as never, locale: "id" })
    .catch(() => null);
  if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
  const base = process.env.NEXT_PUBLIC_BLOG_URL || process.env.SITE_URL || "";
  return NextResponse.json({ id: doc.id, slug: doc.slug, url: `${base}/${doc.slug}` }, { status: 200 });
}
