import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

// Blog lives on its own subdomain (Phase 2). Empty env hides the link (see .env.example).
const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL || "";

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
          {blogUrl ? (
            <a className="nav-link" href={blogUrl}>
              Blog
            </a>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
