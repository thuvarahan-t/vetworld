import { api } from "@/lib/api";
import CategoryCard from "@/components/ui/CategoryCard";
import type { Category } from "@/types";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
    let categories: Category[] = [];
    try {
        categories = await api.getCategories();
    } catch (e) {
        console.error("Failed to fetch categories", e);
    }

    return (
        <main className="categories-page container-main section">
            <header className="categories-hero">
                <div className="categories-hero-kicker">VetWorld catalog</div>
                <h1 className="categories-hero-title">Browse by Category</h1>
                <p className="categories-hero-copy">
                    Find the specialized veterinary and laboratory equipment you need.
                </p>
            </header>

            <div className="categories-list-grid">
                {categories.map((cat) => (
                    <CategoryCard key={cat.id} category={cat} />
                ))}
            </div>

            {categories.length === 0 && (
                <div className="categories-empty-state">
                    <div className="categories-empty-icon" aria-hidden="true" />
                    <p>No categories found.</p>
                </div>
            )}
        </main>
    );
}
