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
  const cur = (await payload.findByID({ collection: "portfolio-entries", id }).catch(() => null)) as any;
  if (!cur) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (cur.curation?.source === "manual") return NextResponse.json({ error: "manual entry" }, { status: 409 });

  const doc = await payload.update({
    collection: "portfolio-entries",
    id,
    data: { _status: "published", curation: { ...cur.curation, status: "approved" } } as never,
    locale: "id",
  });
  const base = process.env.SITE_URL || "";
  return NextResponse.json({ id: doc.id, slug: doc.slug, url: `${base}/portfolio/${doc.slug}` }, { status: 200 });
}
