import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const tabs = [
  { label: "Semua", href: "/" },
  { label: "Hiburan", href: "/?cat=hiburan" },
  { label: "Tech", href: "/?cat=tech" },
  { label: "Tips", href: "/?cat=tips" },
];

export function BlogNav() {
  return (
    <nav className="k-nav">
      <div className="k-wrap k-nav-inner">
        <Link className="k-brand" href="/">
          KANAL<span className="k-brand-dot">.</span>
        </Link>
        <div className="k-nav-links">
          <div className="k-tabs">
            {tabs.map((t) => (
              // ponytail: "Semua" is the static active tab; Task 7's feed wires cat-aware active state
              <Link
                key={t.label}
                className={`k-tab${t.href === "/" ? " k-tab--active" : ""}`}
                href={t.href}
              >
                {t.label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
