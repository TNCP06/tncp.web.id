import { NextRequest, NextResponse } from "next/server";

// Serve the KANAL blog from the `blog.` subdomain by rewriting its paths onto
// the (blog) route group's `_blog/*` segment. Portfolio host (tncp.web.id) is
// untouched — the rewrite only fires when Host starts with `blog.`.
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isBlog = host.startsWith("blog.");
  const { pathname } = req.nextUrl;
  if (
    isBlog &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_blog")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `/_blog${pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
