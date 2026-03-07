import { api } from "@/lib/api";
import CategoryCard from "@/components/ui/CategoryCard";
import type { Category } from "@/types";

export default async function CategoriesPage() {
    let categories: Category[] = [];
    try {
        categories = await api.getCategories();
    } catch (e) {
        console.error("Failed to fetch categories", e);
    }

    return (
        <main className="container-main section">
            <header style={{ marginBottom: "2.5rem" }}>
                <h1 className="section-title">Browse by Category</h1>
                <p className="section-subtitle">
                    Find the specialized veterinary and laboratory equipment you need.
                </p>
            </header>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "1.5rem",
                }}
            >
                {categories.map((cat) => (
                    <CategoryCard key={cat.id} category={cat} />
                ))}
            </div>

            {categories.length === 0 && (
                <div style={{ textAlign: "center", padding: "4rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📁</div>
                    <p style={{ color: "var(--text-secondary)" }}>No categories found.</p>
                </div>
            )}
        </main>
    );
}
