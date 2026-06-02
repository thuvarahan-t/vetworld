import type { ReactNode } from "react";

/* ── "Why Choose VetWorld" feature strip ──────────────────────
   A single brand-gradient panel highlighting the store's key
   selling points (quality, service, delivery, support). Pure
   presentational — safe to render on the server. */

type Feature = {
  icon: ReactNode;
  title: string;
  subtitle: string;
};

const FEATURES: Feature[] = [
  {
    title: "Quality Products",
    subtitle: "Reasonable prices",
    icon: (
      // shield-check
      <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1.2 13.2-3-3 1.4-1.4 1.6 1.6 4-4 1.4 1.4-5.4 5.4Z" />
    ),
  },
  {
    title: "Premium Service",
    subtitle: "Trusted & professional",
    icon: (
      // star
      <path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2Z" />
    ),
  },
  {
    title: "Island-wide Delivery",
    subtitle: "All over Sri Lanka",
    icon: (
      // truck
      <path d="M3 4h11a1 1 0 0 1 1 1v9H4a1 1 0 0 1-1-1V4Zm13 3h3.3a1 1 0 0 1 .8.4l1.7 2.3a1 1 0 0 1 .2.6V14h-6V7ZM7 16.5A2.5 2.5 0 1 1 7 21.5a2.5 2.5 0 0 1 0-5Zm10 0a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
    ),
  },
  {
    title: "Customer Support",
    subtitle: "Always here to help",
    icon: (
      // headset
      <path d="M12 2a9 9 0 0 0-9 9v5a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5v-0a7 7 0 0 1 14 0v0h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1 3 3 0 0 1-3 3h-2a1 1 0 1 0 0 2h2a5 5 0 0 0 5-5v-9a9 9 0 0 0-9-9Z" />
    ),
  },
];

export default function WhyChooseUs() {
  return (
    <section className="section container-main" style={{ paddingTop: 0 }}>
      <div className="dynamic-gradient brand-panel">
        {/* soft decorative glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-30%",
            right: "-10%",
            width: "40%",
            height: "120%",
            background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <h2
          style={{
            textAlign: "center",
            color: "#fff",
            fontSize: "clamp(1.3rem, 4.5vw, 1.6rem)",
            fontWeight: 700,
            marginBottom: "0.4rem",
            position: "relative",
          }}
        >
          Why Choose VetWorld
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.85)",
            fontSize: "0.95rem",
            marginBottom: "1.75rem",
            position: "relative",
          }}
        >
          Quality veterinary & lab equipment, delivered with care
        </p>

        <div className="why-choose-grid">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "0.85rem",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "var(--radius-md)",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="var(--vet-blue)"
                  aria-hidden
                >
                  {f.icon}
                </svg>
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", marginBottom: "0.2rem" }}>
                  {f.title}
                </div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem" }}>
                  {f.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
