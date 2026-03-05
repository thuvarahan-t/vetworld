import { api } from "@/lib/api";
import BannerCarousel from "@/components/ui/BannerCarousel";
import ProductCard from "@/components/ui/ProductCard";
import CategoryCard from "@/components/ui/CategoryCard";
import Link from "next/link";
import type { Banner, Product, Category } from "@/types";

async function getData() {
  try {
    const [banners, topSelling, recent, categories] = await Promise.allSettled([
      api.getBanners(),
      api.getProducts("topSelling=true"),
      api.getProducts("recent=true"),
      api.getCategories(),
    ]);
    return {
      banners: banners.status === "fulfilled" ? banners.value : [],
      topSelling: topSelling.status === "fulfilled" ? topSelling.value : [],
      recent: recent.status === "fulfilled" ? recent.value : [],
      categories: categories.status === "fulfilled" ? categories.value : [],
    };
  } catch {
    return { banners: [], topSelling: [], recent: [], categories: [] };
  }
}

export default async function HomePage() {
  const { banners, topSelling, recent, categories } = await getData();

  return (
    <main>
      {/* ── Banner Carousel ─────────────────────────────── */}
      <section className="container-main">
        <BannerCarousel banners={banners as Banner[]} />
      </section>

      {/* ── Top Selling Products ────────────────────────── */}
      {(topSelling as Product[]).length > 0 && (
        <section className="section container-main">
          <SectionHeader
            title="🔥 Top Selling Products"
            subtitle="Our most popular veterinary and lab equipment"
            href="/category/all?filter=top"
          />
          <ProductGrid products={topSelling as Product[]} />
        </section>
      )}

      {/* ── Recently Added ──────────────────────────────── */}
      {(recent as Product[]).length > 0 && (
        <section className="section container-main" style={{ paddingTop: 0 }}>
          <SectionHeader
            title="🆕 Recently Added"
            subtitle="Fresh arrivals in our product catalogue"
            href="/category/all?filter=recent"
          />
          <ProductGrid products={(recent as Product[]).slice(0, 8)} />
        </section>
      )}

      {/* ── Categories ──────────────────────────────────── */}
      {(categories as Category[]).length > 0 && (
        <section
          className="section"
          style={{ background: "linear-gradient(to bottom, var(--background), var(--vet-blue-light))", marginTop: "1rem" }}
        >
          <div className="container-main">
            <SectionHeader
              title="🧬 Browse by Category"
              subtitle="Find the equipment you need by category"
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "1rem",
              }}
            >
              {(categories as Category[]).map((cat) => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state – backend not connected yet */}
      {(topSelling as Product[]).length === 0 &&
        (recent as Product[]).length === 0 &&
        (categories as Category[]).length === 0 && (
          <section className="section container-main" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚧</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Backend Not Connected
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Start the Spring Boot backend at <code style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 4 }}>localhost:8080</code> to see live products.
            </p>
            <Link href="/cart" className="btn-secondary">
              View Cart →
            </Link>
          </section>
        )}


    </main>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle: string; href?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle" style={{ marginBottom: 0 }}>{subtitle}</p>
      </div>
      {href && (
        <Link href={href} style={{ color: "var(--vet-blue)", fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap" }}>
          View all →
        </Link>
      )}
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "1.25rem",
      }}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
