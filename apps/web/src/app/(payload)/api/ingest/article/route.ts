import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { markdownToLexical, readingTimeMinutes } from "@/lib/ingest";

function authorized(req: NextRequest): boolean {
  const secret = process.env.INGEST_SECRET;
  const header = req.headers.get("authorization");
  return !!secret && header === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });

  const rawPayload = form.get("payload");
  // curl -F sends this as a file part (has a filename), not a plain string field.
  const payloadText =
    rawPayload && typeof rawPayload === "object" && "text" in rawPayload
      ? await (rawPayload as File).text()
      : String(rawPayload ?? "");

  let body: Record<string, unknown>;
  try { body = JSON.parse(payloadText); }
  catch { return NextResponse.json({ error: "invalid payload json" }, { status: 400 }); }

  const { externalId, title, bodyMarkdown, excerpt, category, tags, sources, featured, featuredScore } = body as Record<string, any>;
  if (!externalId || !title || !bodyMarkdown || !category) {
    return NextResponse.json({ error: "externalId, title, bodyMarkdown, category required" }, { status: 400 });
  }

  const payload = await getPayload({ config });

  // optional cover → media
  let coverImage: number | undefined;
  const cover = form.get("cover");
  if (cover && typeof cover === "object" && "arrayBuffer" in cover) {
    const buf = Buffer.from(await (cover as File).arrayBuffer());
    const media = await payload.create({
      collection: "media",
      data: { alt: String(title).slice(0, 200) },
      file: { data: buf, mimetype: (cover as File).type || "image/png", name: (cover as File).name || `${externalId}.png`, size: buf.length },
    });
    coverImage = media.id;
  }

  const data: Record<string, unknown> = {
    title, excerpt: excerpt ?? "",
    body: await markdownToLexical(String(bodyMarkdown)),
    category, source: "ai",
    tags: Array.isArray(tags) ? tags : [],
    sources: Array.isArray(sources) ? sources : [],
    featured: !!featured, featuredScore: Number(featuredScore) || 0,
    readingTime: readingTimeMinutes(String(bodyMarkdown)),
    externalId, _status: "draft",
    ...(coverImage ? { coverImage } : {}),
  };

  const existing = await payload.find({ collection: "articles", where: { externalId: { equals: externalId } }, limit: 1, locale: "id" });
  const doc = existing.docs[0]
    ? await payload.update({ collection: "articles", id: existing.docs[0].id, data: data as never, locale: "id" })
    : await payload.create({ collection: "articles", data: data as never, locale: "id" });

  const adminUrl = `${process.env.SITE_URL ?? ""}/admin/collections/articles/${doc.id}`;
  return NextResponse.json({ id: doc.id, slug: doc.slug, status: "draft", adminUrl }, { status: 201 });
}
