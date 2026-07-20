"use client";

import { useState } from "react";
import Link from "next/link";
import { ENTRY_TYPE_LABEL } from "@/lib/format";
import type { PortfolioEntry } from "@/payload-types";

interface ProjectLedgerProps {
  entries: PortfolioEntry[];
  limit?: number;
  showFilters?: boolean;
  showAllLink?: boolean;
}

export function ProjectLedger({
  entries,
  limit,
  showFilters = false,
  showAllLink = false,
}: ProjectLedgerProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  if (entries.length === 0) {
    return <p className="empty">No published works yet.</p>;
  }

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // Filter by active tab, floating featured entries to the top.
  const filteredEntries = entries
    .filter((e) => activeFilter === "all" || e.entryType === activeFilter)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  const visibleEntries = showAllLink
    ? filteredEntries.slice(0, limit ?? 6)
    : filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="project-ledger-container">
      {showFilters && (
        <div className="filter-tabs">
          <span className="mono" style={{ marginRight: "0.5rem" }}>Filter</span>
          {[
            { label: "All", value: "all" },
            { label: "Projects", value: "project" },
            { label: "Work", value: "work_experience" },
            { label: "Education", value: "education" },
            { label: "Other", value: "other" },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`filter-tab${activeFilter === tab.value ? " filter-tab--active" : ""}`}
              onClick={() => handleFilterChange(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="ledger">
        {visibleEntries.map((e, i) => {
          const stack = (e.techStack ?? []).filter(Boolean) as string[];
          const coverUrl =
            typeof e.coverImage === "object" && e.coverImage && "url" in e.coverImage
              ? (e.coverImage as { url: string }).url
              : null;

          return (
            <article className="entry" key={e.id}>
              <div className="entry-figure">
                <Link
                  href={`/portfolio/${e.slug ?? ""}`}
                  className="entry-stretched-link"
                  aria-label={`View details for ${e.title}`}
                />
                {coverUrl ? (
                  <img
                    className="entry-thumbnail"
                    src={coverUrl}
                    alt={e.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="entry-thumbnail-fallback">
                    <svg
                      className="entry-thumbnail-fallback-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="0" />
                      <path d="M6 8L10 11L6 14" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 13H16" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="entry-body">
                <div className="entry-header">
                  <span className="entry-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="entry-type">
                    {ENTRY_TYPE_LABEL[e.entryType] ?? "Entry"}
                  </span>
                  {e.featured ? <span className="badge">Featured</span> : null}
                </div>

                <h3 className="entry-title">
                  <Link href={`/portfolio/${e.slug ?? ""}`}>{e.title}</Link>
                </h3>

                {e.summary ? <p className="entry-summary">{e.summary}</p> : null}

                {stack.length > 0 ? (
                  <p className="fingerprint">
                    {stack.map((t, k) => (
                      <span key={k}>{t}</span>
                    ))}
                  </p>
                ) : null}

                {e.links && e.links.length > 0 ? (
                  <p className="entry-links">
                    {e.links.map((l, k) => (
                      <a key={k} href={l.url} target="_blank" rel="noreferrer">
                        {l.label} ↗
                      </a>
                    ))}
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {showAllLink && filteredEntries.length > (limit ?? 6) && (
        <div className="ledger-actions">
          <Link href="/portfolio" className="btn">
            View full archive →
          </Link>
        </div>
      )}

      {!showAllLink && totalPages > 1 && (
        <div className="ledger-actions">
          <button
            className="btn-show-more"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            type="button"
            style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`btn-show-more${currentPage === page ? " filter-tab--active" : ""}`}
              onClick={() => setCurrentPage(page)}
              type="button"
              style={{
                minWidth: "3rem",
                background: currentPage === page ? "var(--ink)" : "transparent",
                color: currentPage === page ? "var(--paper)" : "var(--ink)",
              }}
            >
              {String(page).padStart(2, "0")}
            </button>
          ))}
          <button
            className="btn-show-more"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            type="button"
            style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
