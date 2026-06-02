// Streamed instantly while the server fetches the category list — tapping the
// Categories tab navigates immediately and shows this skeleton instead of
// freezing on the previous page.
export default function CategoriesLoading() {
    return (
        <main className="categories-page container-main section">
            <style>{`@keyframes vw-pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>

            {/* Hero placeholder */}
            <header className="categories-hero">
                <div style={{ width: 140, height: 16, borderRadius: 6, background: "var(--border)", margin: "0 auto 0.75rem", animation: "vw-pulse 1.5s ease-in-out infinite" }} />
                <div style={{ width: 280, height: 34, borderRadius: 8, background: "var(--border)", margin: "0 auto 0.75rem", animation: "vw-pulse 1.5s ease-in-out infinite" }} />
                <div style={{ width: 360, height: 16, borderRadius: 6, background: "var(--border)", maxWidth: "90%", margin: "0 auto", animation: "vw-pulse 1.5s ease-in-out infinite" }} />
            </header>

            {/* Category card grid skeleton */}
            <div className="categories-list-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        style={{
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-lg)",
                            overflow: "hidden",
                            animation: "vw-pulse 1.5s ease-in-out infinite",
                            animationDelay: `${(i % 4) * 0.08}s`,
                        }}
                    >
                        <div style={{ aspectRatio: "4 / 3", background: "var(--border)" }} />
                        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ height: 16, width: "70%", borderRadius: 6, background: "var(--border)" }} />
                            <div style={{ height: 12, width: "45%", borderRadius: 6, background: "var(--border)" }} />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
