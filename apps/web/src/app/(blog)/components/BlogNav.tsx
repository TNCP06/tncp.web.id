"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const tabs = [
  { label: "Semua", value: "", href: "/" },
  { label: "Hiburan", value: "hiburan", href: "/?cat=hiburan" },
  { label: "Tech", value: "tech", href: "/?cat=tech" },
  { label: "Tips", value: "tips", href: "/?cat=tips" },
];

export function BlogNav() {
  const cat = useSearchParams().get("cat") ?? "";

  return (
    <nav className="k-nav">
      <div className="k-wrap k-nav-inner">
        <Link className="k-brand" href="/">
          KANAL<span className="k-brand-dot">.</span>
        </Link>
        <div className="k-nav-links">
          <div className="k-tabs">
            {tabs.map((t) => (
              <Link
                key={t.label}
                className={`k-tab${t.value === cat ? " k-tab--active" : ""}`}
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
