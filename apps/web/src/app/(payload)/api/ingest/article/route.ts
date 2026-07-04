import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import sharp from "sharp";
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
    const raw = Buffer.from(await (cover as File).arrayBuffer());
    // Covers from agy are ~2MB PNGs. Downscale to <=1600w and re-encode as
    // WebP q80 (near-lossless, ~10x smaller) to save storage + bandwidth.
    // Fall back to the original bytes if sharp can't decode it.
    let buf = raw;
    let mimetype = (cover as File).type || "image/png";
    let name = (cover as File).name || `${externalId}.png`;
    try {
      buf = await sharp(raw)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      mimetype = "image/webp";
      name = `${externalId}.webp`;
    } catch {
      /* keep original bytes */
    }
    const media = await payload.create({
      collection: "media",
      data: { alt: String(title).slice(0, 200) },
      file: { data: buf, mimetype, name, size: buf.length },
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
    externalId,
    ...(coverImage ? { coverImage } : {}),
  };

  const existing = await payload.find({ collection: "articles", where: { externalId: { equals: externalId } }, limit: 1, locale: "id" });
  // On update, never touch _status — re-ingesting a published article must not
  // unpublish it. Only a brand-new article is created as a draft.
  const doc = existing.docs[0]
    ? await payload.update({ collection: "articles", id: existing.docs[0].id, data: data as never, locale: "id" })
    : await payload.create({ collection: "articles", data: { ...data, _status: "draft" } as never, locale: "id" });

  const adminUrl = `${process.env.SITE_URL ?? ""}/admin/collections/articles/${doc.id}`;
  return NextResponse.json({ id: doc.id, slug: doc.slug, status: "draft", adminUrl }, { status: 201 });
}
