import { api } from "@/lib/api";
import ProductCard from "@/components/ui/ProductCard";
import Link from "next/link";
import type { Product, Category } from "@/types";

interface Params {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ q?: string; filter?: string }>;
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
    const { q, filter } = await searchParams;
    const { products, categories, categoryName } = await getData(id);

    let filtered = products as Product[];
    if (filter === "top") filtered = filtered.filter((p) => p.topSelling);
    if (q) {
        const Fuse = (await import("fuse.js")).default;
        const fuse = new Fuse(filtered, {
            keys: ["name", "description"],
            threshold: 0.35, // 0 is exact, 1 is anything. 0.35 is good for typos.
            distance: 100,
            ignoreLocation: true
        });
        filtered = fuse.search(q).map(res => res.item);
    }

    return (
        <main>
            {/* ── Category Nav ───────────────── */}
            <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                <div
                    className="container-main"
                    style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 1.5rem", overflowX: "auto" }}
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

            <div className="container-main section">
                {/* ── Header + Search ────────────── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h1 className="section-title">{categoryName}</h1>
                        <p className="section-subtitle" style={{ marginBottom: 0 }}>
                            {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
                        </p>
                    </div>
                    <form method="GET" style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                            name="q"
                            defaultValue={q}
                            className="input"
                            placeholder="Search products..."
                            style={{ width: 220 }}
                        />
                        <button type="submit" className="btn-primary" style={{ whiteSpace: "nowrap" }}>
                            Search
                        </button>
                    </form>
                </div>

                {/* ── Product Grid ────────────────── */}
                {filtered.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem" }}>
                        {filtered.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                        <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No products found</h2>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
                            {q ? `No results for "${q}"` : "No products in this category yet."}
                        </p>
                        <Link href="/category/all" className="btn-secondary">Browse All Products</Link>
                    </div>
                )}
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
