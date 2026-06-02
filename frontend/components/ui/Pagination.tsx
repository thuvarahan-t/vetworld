import Link from "next/link";

/* ── Server-rendered pagination ───────────────────────────────
   Pure <Link> controls (no client JS) for the product listing.
   Preserves the current query (search/sort/filters) and only swaps
   the `page` param. Page 1 omits the param to keep URLs clean. */

interface Props {
  basePath: string;
  query: Record<string, string | undefined>;
  currentPage: number;
  totalPages: number;
}

// Compact page list with ellipsis: 1 … 4 5 6 … 10
function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "ellipsis")[] = [1];
  if (current > 3) out.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) out.push(i);
  if (current < total - 2) out.push("ellipsis");
  out.push(total);
  return out;
}

export default function Pagination({ basePath, query, currentPage, totalPages }: Props) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (k !== "page" && v != null && v !== "") params.set(k, v);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = pageList(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Pagination"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        marginTop: "2.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Prev */}
        {hasPrev ? (
          <Link href={hrefFor(currentPage - 1)} style={arrowStyle} aria-label="Previous page">
            ‹
          </Link>
        ) : (
          <span style={{ ...arrowStyle, ...disabledStyle }} aria-hidden>‹</span>
        )}

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e${i}`} style={{ ...numStyle, border: "none", cursor: "default", color: "var(--text-muted)" }}>
              …
            </span>
          ) : p === currentPage ? (
            <span key={p} aria-current="page" style={{ ...numStyle, ...activeStyle }}>
              {p}
            </span>
          ) : (
            <Link key={p} href={hrefFor(p)} style={numStyle}>
              {p}
            </Link>
          )
        )}

        {/* Next */}
        {hasNext ? (
          <Link href={hrefFor(currentPage + 1)} style={arrowStyle} aria-label="Next page">
            ›
          </Link>
        ) : (
          <span style={{ ...arrowStyle, ...disabledStyle }} aria-hidden>›</span>
        )}
      </div>

      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>
        Page {currentPage} of {totalPages}
      </span>
    </nav>
  );
}

const numStyle: React.CSSProperties = {
  minWidth: 38,
  height: 38,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 0.5rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text-secondary)",
  fontSize: "0.88rem",
  fontWeight: 600,
  transition: "all var(--transition)",
};

const activeStyle: React.CSSProperties = {
  background: "var(--vet-blue)",
  borderColor: "var(--vet-blue)",
  color: "#fff",
};

const arrowStyle: React.CSSProperties = {
  ...numStyle,
  fontSize: "1.2rem",
  fontWeight: 700,
};

const disabledStyle: React.CSSProperties = {
  opacity: 0.4,
  cursor: "not-allowed",
  color: "var(--text-muted)",
};
