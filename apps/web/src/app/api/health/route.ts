// Healthcheck for Docker/compose (Stage E). Trivial and dependency-free.
export function GET() {
  return Response.json({ status: "ok" }, { status: 200 });
}
