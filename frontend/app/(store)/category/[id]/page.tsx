import { api } from "@/lib/api";
import ProductCard from "@/components/ui/ProductCard";
import FilterBar from "@/components/ui/FilterControls";
import Link from "next/link";
import type { Product, Category } from "@/types";

interface Params {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ 
        q?: string; 
        filter?: string; 
        sort?: string; 
        min?: string; 
        max?: string; 
        inStock?: string 
    }>;
}

async function getData(categoryId: string) {
    try {
        if (categoryId === "all") {
            const [products, categories] = await Promise.all([
                api.getProducts(),
                api.getCategories(),
            ]);
            return { products, categories, categoryName: "All Products" };
        } else {
            const [products, category, categories] = await Promise.all([
                api.getCategoryProducts(Number(categoryId)),
                api.getCategory(Number(categoryId)),
                api.getCategories(),
            ]);
            return {
                products,
                categories,
                categoryName: category.name,
            };
        }
    } catch {
        return { products: [], categories: [], categoryName: "Products" };
    }
}

export default async function CategoryPage({ params, searchParams }: Params) {
    const { id } = await params;
    const { q, filter, sort, min, max, inStock } = await searchParams;
    const { products, categories, categoryName } = await getData(id);

    let filtered = products as Product[];
    
    // 1. Text Search
    if (q) {
        const Fuse = (await import("fuse.js")).default;
        const fuse = new Fuse(filtered, {
            keys: ["name", "description"],
            threshold: 0.35,
            distance: 100,
            ignoreLocation: true
        });
        filtered = fuse.search(q).map(res => res.item);
    }

    // 2. Simple quick filters
    if (filter === "top") filtered = filtered.filter((p) => p.topSelling);

    // 3. Advanced Filters
    if (inStock === "true") {
        filtered = filtered.filter(p => {
            const hasMainStock = !p.soldOut;
            const hasTypeStock = p.types?.some(t => !t.soldOut);
            return hasMainStock && hasTypeStock;
        });
    }

    if (min) filtered = filtered.filter(p => p.types?.some(t => t.price >= Number(min)));
    if (max) filtered = filtered.filter(p => p.types?.some(t => t.price <= Number(max)));

    // 4. Sorting
    if (sort) {
        filtered = [...filtered].sort((a, b) => {
            const priceA = a.types?.[0]?.price || 0;
            const priceB = b.types?.[0]?.price || 0;
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();

            switch (sort) {
                case "price-low": return priceA - priceB;
                case "price-high": return priceB - priceA;
                case "newest": return dateB - dateA;
                case "popular": return (a.topSelling ? 0 : 1) - (b.topSelling ? 0 : 1);
                default: return 0;
            }
        });
    }

    return (
        <main>
            {/* ── Category Nav ───────────────── */}
            <div style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                <div
                    className="container-main"
                    style={{ display: "flex", gap: "0.75rem", padding: "1rem 1.5rem", overflowX: "auto" }}
                >
                    <Link
                        href="/category/all"
                        style={{ ...chipStyle, background: id === "all" ? "var(--vet-blue)" : "var(--background)", color: id === "all" ? "#fff" : "var(--text-secondary)" }}
                    >
                        All
                    </Link>
                    {(categories as Category[]).map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/category/${cat.id}`}
                            style={{ ...chipStyle, background: String(cat.id) === id ? "var(--vet-blue)" : "var(--background)", color: String(cat.id) === id ? "#fff" : "var(--text-secondary)" }}
                        >
                            {cat.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="container-main" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}>
                <div>
                    {/* Unified Header: Title, Filters & Search */}
                    <FilterBar title={categoryName} productsCount={filtered.length} />

                    {/* Main Content Area */}
                    <div>
                        {/* ── Product Grid ────────────────── */}
                        {filtered.length > 0 ? (
                            <div className="product-results-grid">
                                {filtered.map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "rgba(255,255,255,0.3)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)" }}>
                                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                                <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No products found</h2>
                                <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                                    {q ? `No results for "${q}"` : "No products match your filters."}
                                </p>
                                <Link href={`/category/${id}`} className="btn-secondary">Clear Search & Filters</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

const chipStyle: React.CSSProperties = {
    padding: "0.35rem 0.9rem",
    borderRadius: 999,
    fontSize: "0.82rem",
    fontWeight: 500,
    whiteSpace: "nowrap",
    border: "1px solid var(--border)",
    transition: "all 0.2s",
    cursor: "pointer",
};
