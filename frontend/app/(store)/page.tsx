import { api } from "@/lib/api";
import BannerCarousel from "@/components/ui/BannerCarousel";
import ProductCard from "@/components/ui/ProductCard";
import ProductCarousel from "@/components/ui/ProductCarousel";
import CategoryCard from "@/components/ui/CategoryCard";
import WhyChooseUs from "@/components/ui/WhyChooseUs";
import GetInTouch from "@/components/ui/GetInTouch";
import Reveal from "@/components/ui/Reveal";
import Link from "next/link";
import type { Banner, Product, Category } from "@/types";

export const dynamic = "force-dynamic";

type CategorySection = { category: Category; products: Product[] };

async function getData() {
  try {
    const [banners, topSelling, recent, categories] = await Promise.allSettled([
      api.getBanners(),
      api.getProducts("topSelling=true"),
      api.getProducts("recent=true"),
      api.getCategories(),
    ]);

    const categoryList = categories.status === "fulfilled" ? categories.value : [];

    // The 2 most recently added categories (Category has no updatedAt, so we
    // order by createdAt desc; categories without a date fall to the back).
    const latestCategories = [...categoryList]
      .sort((a, b) => (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0))
      .slice(0, 2);

    const latestCategoryProducts = await Promise.allSettled(
      latestCategories.map((cat) => api.getCategoryProducts(cat.id))
    );

    // Only keep sections that actually have products to show.
    const categorySections: CategorySection[] = latestCategories
      .map((category, i) => ({
        category,
        products: latestCategoryProducts[i].status === "fulfilled" ? latestCategoryProducts[i].value : [],
      }))
      .filter((section) => section.products.length > 0);

    return {
      banners: banners.status === "fulfilled" ? banners.value : [],
      topSelling: topSelling.status === "fulfilled" ? topSelling.value : [],
      recent: recent.status === "fulfilled" ? recent.value : [],
      categories: categoryList,
      categorySections,
    };
  } catch {
    return { banners: [], topSelling: [], recent: [], categories: [], categorySections: [] };
  }
}

export default async function HomePage() {
  const { banners, topSelling, recent, categories, categorySections } = await getData();

  return (
    <main style={{ position: "relative", overflow: "hidden" }}>
      {/* ── Background Decorative Elements ──────────────── */}
      <div style={{ position: "fixed", top: "-10%", left: "-5%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(26,115,232,0.15) 0%, transparent 70%)", filter: "blur(60px)", zIndex: -1 }}></div>
      <div style={{ position: "fixed", bottom: "10%", right: "-5%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)", filter: "blur(60px)", zIndex: -1 }}></div>
      <div style={{ position: "fixed", top: "40%", right: "10%", width: "25vw", height: "25vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(13,158,110,0.1) 0%, transparent 70%)", filter: "blur(60px)", zIndex: -1 }}></div>

      {/* ── Banner Carousel ─────────────────────────────── */}
      <section className="container-main">
        <BannerCarousel banners={banners as Banner[]} />
      </section>

      {/* ── Top Selling Products ────────────────────────── */}
      {(topSelling as Product[]).length > 0 && (
        <Reveal>
          <section className="section container-main">
            <SectionHeader
              title="🔥 Top Selling Products"
              subtitle="Our most popular veterinary and lab equipment"
              href="/category/all?filter=top"
            />
            <div className="glass-morphism carousel-panel" style={{ marginTop: "1rem" }}>
              <ProductCarousel products={topSelling as Product[]} />
            </div>
          </section>
        </Reveal>
      )}

      {/* ── Recently Added ──────────────────────────────── */}
      {(recent as Product[]).length > 0 && (
        <Reveal>
          <section className="section container-main" style={{ paddingTop: 0 }}>
            <SectionHeader
              title="Recently Added"
              subtitle="Fresh arrivals in our product catalogue"
              href="/category/all?filter=recent"
            />
            <div className="glass-morphism carousel-panel" style={{ marginTop: "1rem" }}>
              <ProductCarousel products={(recent as Product[]).slice(0, 10)} />
            </div>
          </section>
        </Reveal>
      )}

      {/* ── Latest Categories (2 most recently added) ───── */}
      {(categorySections as CategorySection[]).map(({ category, products }) => (
        <Reveal key={category.id}>
          <section className="section container-main" style={{ paddingTop: 0 }}>
            <SectionHeader
              title={category.name}
              subtitle={`Browse products from ${category.name}`}
              href={`/category/${category.id}`}
            />
            <div className="glass-morphism carousel-panel" style={{ marginTop: "1rem" }}>
              <ProductCarousel products={products.slice(0, 10)} />
            </div>
          </section>
        </Reveal>
      ))}

      {/* ── Categories ──────────────────────────────────── */}
      {(categories as Category[]).length > 0 && (
        <Reveal>
          <section
            className="section"
            style={{ paddingTop: 0, position: "relative" }}
          >
            <div className="container-main">
              <div className="glass-morphism section-panel" style={{ background: "rgba(232, 240, 254, 0.4)" }}>
                <SectionHeader
                  title="🧬 Browse by Category"
                  subtitle="Find the equipment you need by category"
                />
                <div
                  className="category-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "1.5rem",
                    marginTop: "1.5rem"
                  }}
                >
                  {(categories as Category[]).map((cat) => (
                    <CategoryCard key={cat.id} category={cat} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* ── Why Choose VetWorld ─────────────────────────── */}
      <Reveal>
        <WhyChooseUs />
      </Reveal>

      {/* ── Get In Touch ────────────────────────────────── */}
      <Reveal>
        <GetInTouch />
      </Reveal>

      {/* Empty state – backend reachable but no catalog data yet */}
      {(topSelling as Product[]).length === 0 &&
        (recent as Product[]).length === 0 &&
        (categories as Category[]).length === 0 && (
          <section className="section container-main" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚧</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              No Catalog Data Yet
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              The backend is reachable, but it is not returning any products or categories yet.
              Add catalog data in the admin panel or seed the database to populate this page.
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
    <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "0.5rem" }}>
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
