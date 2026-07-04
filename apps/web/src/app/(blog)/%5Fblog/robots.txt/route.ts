// `||` not `??`: .env sets NEXT_PUBLIC_BLOG_URL="" (empty, not unset) until filled in.
const base = process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.tncp.web.id";

export function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
