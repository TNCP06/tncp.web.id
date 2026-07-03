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
    return <p className="empty">No published entries yet.</p>;
  }

  // Reset pagination state when switching filter tabs
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // Filter entries based on the active tab, sorting featured to the top
  const filteredEntries = entries
    .filter((e) => {
      if (activeFilter === "all") return true;
      return e.entryType === activeFilter;
    })
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  // Pagination slicing (homepage uses limit, archive uses page calculations)
  const visibleEntries = showAllLink
    ? filteredEntries.slice(0, limit ?? 6)
    : filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="project-ledger-container">
      {/* Category Filter Tabs */}
      {showFilters && (
        <div className="filter-tabs">
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

      {/* Grid Ledger */}
      <div className="ledger">
        {visibleEntries.map((e) => {
          const stack = (e.techStack ?? []).filter(Boolean) as string[];
          const coverUrl =
            typeof e.coverImage === "object" && e.coverImage && "url" in e.coverImage
              ? (e.coverImage as { url: string }).url
              : null;

          return (
            <article
              className={`entry${e.featured ? " entry--featured" : ""}`}
              key={e.id}
            >
              {/* Top Clickable Area Wrapper */}
              <div className="entry-card-top-link-wrapper">
                <Link
                  href={`/portfolio/${e.slug ?? ""}`}
                  className="entry-stretched-link"
                  aria-label={`View details for ${e.title}`}
                />

                <div className="entry-thumbnail-wrapper">
                  {coverUrl ? (
                    <img
                      className="entry-thumbnail"
                      src={coverUrl}
                      alt={e.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="entry-thumbnail-fallback">
                      <svg className="entry-thumbnail-fallback-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" stroke="var(--slate)" strokeOpacity="0.4"/>
                        <path d="M6 8L10 11L6 14" stroke="var(--blue)" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 13H16" stroke="var(--blue)" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="entry-top-content">
                  <div className="entry-header">
                    <span className="mono entry-type">
                      {ENTRY_TYPE_LABEL[e.entryType] ?? "Entry"}
                    </span>
                    {e.featured ? (
                      <span className="badge">Featured</span>
                    ) : null}
                  </div>

                  <h3 className="entry-title">
                    {e.title}
                  </h3>

                  {e.summary ? (
                    <>
                      <span className="entry-title-divider" aria-hidden="true" />
                      <p className="entry-summary">{e.summary}</p>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Bottom Non-Clickable Area (Contains Stack & Links) */}
              <div className="entry-card-bottom-content">
                {stack.length > 0 ? (
                  <p className="fingerprint">{stack.join("  ·  ")}</p>
                ) : null}

                {e.links && e.links.length > 0 ? (
                  <p className="entry-links">
                    {e.links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noreferrer">
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

      {/* Homepage Redirect Button */}
      {showAllLink && filteredEntries.length > (limit ?? 6) && (
        <div className="ledger-actions">
          <Link href="/portfolio" className="btn btn-primary">
            View All Projects & Archive →
          </Link>
        </div>
      )}

      {/* Numbered Pagination (Archive Page) */}
      {!showAllLink && totalPages > 1 && (
        <div className="ledger-actions" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            type="button"
            style={{
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`btn${currentPage === page ? " btn-primary" : ""}`}
              onClick={() => setCurrentPage(page)}
              type="button"
              style={{ minWidth: "2.5rem" }}
            >
              {String(page).padStart(2, "0")}
            </button>
          ))}

          <button
            className="btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            type="button"
            style={{
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
