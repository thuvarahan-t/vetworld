// Streamed instantly while the server fetches catalog data — gives a Netflix-style
// skeleton immediately instead of a blank/frozen screen.
export default function CategoryLoading() {
    return (
        <main>
            <style>{`@keyframes vw-pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>

            {/* Category chip bar placeholder */}
            <div style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.4)" }}>
                <div className="container-main" style={{ display: "flex", gap: "0.75rem", padding: "1rem 1.5rem", overflow: "hidden" }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ width: 84, height: 30, borderRadius: 999, background: "var(--border)", flexShrink: 0, animation: "vw-pulse 1.5s ease-in-out infinite" }} />
                    ))}
                </div>
            </div>

            <div className="container-main" style={{ paddingTop: "1.5rem", paddingBottom: "3rem" }}>
                {/* Title placeholder */}
                <div style={{ width: 220, height: 32, borderRadius: 8, background: "var(--border)", marginBottom: "1.5rem", animation: "vw-pulse 1.5s ease-in-out infinite" }} />

                {/* Product grid skeleton */}
                <div className="product-results-grid">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-lg)",
                                overflow: "hidden",
                                animation: "vw-pulse 1.5s ease-in-out infinite",
                                animationDelay: `${(i % 6) * 0.08}s`,
                            }}
                        >
                            <div style={{ aspectRatio: "1 / 1", background: "var(--border)" }} />
                            <div style={{ padding: "1.25rem 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                <div style={{ height: 14, width: "85%", borderRadius: 6, background: "var(--border)" }} />
                                <div style={{ height: 14, width: "55%", borderRadius: 6, background: "var(--border)" }} />
                                <div style={{ height: 20, width: "40%", borderRadius: 6, background: "var(--border)", marginTop: "0.4rem" }} />
                                <div style={{ height: 38, width: "100%", borderRadius: "var(--radius-md)", background: "var(--border)", marginTop: "0.5rem" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
