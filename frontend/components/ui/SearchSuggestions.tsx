"use client";
import Link from "next/link";
import type { Product } from "@/types";

/* Type-ahead suggestions panel shown under the navbar search box. Renders the
   matched products (image + name + price) plus a "see all results" footer that
   runs the full search. Purely presentational — the parent owns visibility. */

interface Props {
  results: Product[];
  query: string;
  onSelect: () => void;
}

export default function SearchSuggestions({ results, query, onSelect }: Props) {
  const trimmed = query.trim();
  if (!trimmed) return null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        overflow: "hidden",
      }}
    >
      {results.length > 0 ? (
        <>
          <ul style={{ listStyle: "none", margin: 0, padding: "0.35rem", maxHeight: "60vh", overflowY: "auto" }}>
            {results.map((p) => {
              const price = p.types?.[0]?.price;
              return (
                <li key={p.id}>
                  <Link
                    href={`/product/${p.id}`}
                    onClick={onSelect}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.55rem 0.6rem",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-primary)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--vet-blue-light)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        flexShrink: 0,
                        borderRadius: "var(--radius-sm)",
                        background: "#f1f5f9",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", padding: 3 }} />
                      ) : (
                        <span style={{ fontSize: "1.1rem" }}>🧪</span>
                      )}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.name}
                      </div>
                      {price != null && (
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--vet-blue)" }}>
                          Rs. {Number(price).toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={`/category/all?q=${encodeURIComponent(trimmed)}`}
            onClick={onSelect}
            style={{
              display: "block",
              padding: "0.7rem 0.85rem",
              borderTop: "1px solid var(--border)",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--vet-blue)",
              textAlign: "center",
            }}
          >
            See all results for “{trimmed}” →
          </Link>
        </>
      ) : (
        <div style={{ padding: "1rem 0.85rem", fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center" }}>
          No products match “{trimmed}”
        </div>
      )}
    </div>
  );
}
