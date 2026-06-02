"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { Product } from "@/types";

/* Live product search for the navbar search box. Products are fetched once
   (the first time anyone searches or focuses the box) and shared across every
   hook instance via a module-level cache, so the desktop and mobile search
   boxes don't double fetch. Matching is a cheap case-insensitive substring on
   name/description — enough for type-ahead suggestions (the full results page
   uses Fuse.js). */

let cache: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;

function loadProducts(): Promise<Product[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = api
      .getProducts()
      .then((p) => {
        cache = p;
        return p;
      })
      .catch((e) => {
        inflight = null; // allow a retry on the next keystroke
        throw e;
      });
  }
  return inflight;
}

/** Warm the catalog cache ahead of time (e.g. when the search box is focused)
    so the first keystroke shows results instantly. */
export function prefetchProducts(): void {
  loadProducts().catch(() => {});
}

export interface ProductSearchState {
  results: Product[];
  loading: boolean;
}

export function useProductSearch(query: string, limit = 6): ProductSearchState {
  const [products, setProducts] = useState<Product[]>(cache ?? []);
  const [loading, setLoading] = useState(false);
  const trimmed = query.trim();

  // Lazily load the catalog the first time the user types something.
  useEffect(() => {
    if (!trimmed) return;
    if (cache) {
      setProducts(cache);
      return;
    }
    let active = true;
    setLoading(true);
    loadProducts()
      .then((p) => {
        if (active) setProducts(p);
      })
      .catch(() => {
        /* network error — suggestions just stay empty */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trimmed]);

  const results = useMemo(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
      .slice(0, limit);
  }, [trimmed, products, limit]);

  // Only "loading" while we have nothing to show yet — avoids flashing the
  // empty "no match" state before the catalog has arrived.
  return { results, loading: loading && products.length === 0 };
}
