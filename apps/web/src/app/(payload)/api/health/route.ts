// Healthcheck for Docker/compose (Stage E). Static route — shadows Payload's /api/[...slug].
export function GET() {
  return Response.json({ status: "ok" }, { status: 200 });
}
