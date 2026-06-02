// Streamed instantly while the home page server-fetches catalog data, so tapping
// the Home tab navigates immediately and shows this placeholder instead of
// freezing on the previous page. Mirrors the real layout: banner + carousels.
export default function HomeSkeleton() {
    const Row = ({ cards = 5 }: { cards?: number }) => (
        <section className="section container-main" style={{ paddingTop: 0 }}>
            {/* Section header placeholder */}
            <div style={{ width: 240, height: 26, borderRadius: 8, background: "var(--border)", marginBottom: "0.6rem", animation: "vw-pulse 1.5s ease-in-out infinite" }} />
            <div style={{ width: 320, height: 14, borderRadius: 6, background: "var(--border)", marginBottom: "1rem", animation: "vw-pulse 1.5s ease-in-out infinite" }} />

            {/* Horizontal card row */}
            <div className="glass-morphism carousel-panel" style={{ marginTop: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", overflow: "hidden" }}>
                    {Array.from({ length: cards }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                flex: "0 0 200px",
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-lg)",
                                overflow: "hidden",
                                animation: "vw-pulse 1.5s ease-in-out infinite",
                                animationDelay: `${i * 0.08}s`,
                            }}
                        >
                            <div style={{ aspectRatio: "1 / 1", background: "var(--border)" }} />
                            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                <div style={{ height: 14, width: "85%", borderRadius: 6, background: "var(--border)" }} />
                                <div style={{ height: 14, width: "55%", borderRadius: 6, background: "var(--border)" }} />
                                <div style={{ height: 20, width: "40%", borderRadius: 6, background: "var(--border)", marginTop: "0.4rem" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );

    return (
        <>
            <style>{`@keyframes vw-pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>

            {/* Banner placeholder */}
            <section className="container-main">
                <div style={{ width: "100%", aspectRatio: "16 / 5", minHeight: 180, borderRadius: "var(--radius-lg)", background: "var(--border)", animation: "vw-pulse 1.5s ease-in-out infinite" }} />
            </section>

            <div style={{ height: "1.5rem" }} />
            <Row cards={5} />
            <Row cards={5} />
        </>
    );
}
