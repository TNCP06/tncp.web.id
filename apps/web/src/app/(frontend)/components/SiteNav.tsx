import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

// Blog lives on its own subdomain (Phase 2). Empty env hides the link (see .env.example).
const blogUrl = process.env.NEXT_PUBLIC_BLOG_URL || "";

export function SiteNav() {
  return (
    <nav className="site-nav">
      <div className="nav-inner wrap">
        <div className="nav-brand-group">
          <Link className="nav-brand" href="/">
            TNCP
          </Link>
          <a
            className="nav-github"
            href="https://github.com/TNCP06"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="currentColor"
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.27 5.67.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.21.66.8.55A10.99 10.99 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
            </svg>
          </a>
        </div>
        <div className="nav-links">
          <Link className="nav-link" href="/">
            Home
          </Link>
          <Link className="nav-link" href="/portfolio">
            Portfolio
          </Link>
          <Link className="nav-link" href="/stack">
            Tech Stack
          </Link>
          <Link className="nav-link" href="/#about">
            About
          </Link>
          {blogUrl ? (
            <a className="nav-link" href={blogUrl}>
              Blog
            </a>
          ) : null}
          <Link className="nav-cta" href="/#contact">
            Contact
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
