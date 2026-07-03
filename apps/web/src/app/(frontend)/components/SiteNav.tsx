import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

// Blog lives on its own subdomain (Phase 2). Overridable via env for local testing.
const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL || "https://blog.tncp.web.id";

export function SiteNav() {
  return (
    <nav className="site-nav">
      <div className="nav-inner wrap">
        <Link className="nav-brand" href="/">
          TNCP
        </Link>
        <div className="nav-links">
          <Link className="nav-link" href="/#work">
            Work
          </Link>
          <Link className="nav-link" href="/#about">
            About
          </Link>
          <Link className="nav-link" href="/#contact">
            Contact
          </Link>
          <a className="nav-link" href={blogUrl}>
            Blog
          </a>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
