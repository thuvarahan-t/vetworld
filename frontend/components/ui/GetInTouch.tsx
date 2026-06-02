import type { ReactNode } from "react";

/* ── "Get In Touch" contact section ───────────────────────────
   Brand-gradient panel with contact rows (phone, location) plus a
   WhatsApp support call-to-action. Pure presentational links —
   safe to render on the server (no client JS needed). */

const PHONE_DISPLAY = "+94 77 330 0802";
const PHONE_TEL = "+94773300802";
const WHATSAPP_NUMBER = "94773300802";
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hello VetWorld! I have an inquiry."
)}`;
const ADDRESS = "15/A, Ebenezer Place, Dehiwala, Sri Lanka";

type Row = { icon: ReactNode; label: string; value: string; href?: string };

const ROWS: Row[] = [
  {
    label: "Phone",
    value: PHONE_DISPLAY,
    href: `tel:${PHONE_TEL}`,
    icon: <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.58 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .58 3.6 1 1 0 0 1-.24 1l-2.24 2.2Z" />,
  },
  {
    label: "Location",
    value: ADDRESS,
    href: `https://maps.google.com/?q=${encodeURIComponent(ADDRESS)}`,
    icon: <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />,
  },
];

export default function GetInTouch() {
  return (
    <section className="section container-main" style={{ paddingTop: 0 }}>
      <div className="dynamic-gradient brand-panel">
        {/* soft decorative glow */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "-30%",
            left: "-10%",
            width: "40%",
            height: "120%",
            background: "radial-gradient(circle, rgba(255,255,255,0.16) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div className="get-in-touch-grid">
          {/* ── Heading + contact rows ─────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
            <h2
              style={{
                color: "#fff",
                fontSize: "clamp(1.3rem, 4.5vw, 1.6rem)",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Get In Touch
            </h2>
            {ROWS.map((row) => {
              const inner = (
                <>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "var(--radius-md)",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.16)",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--vet-blue)" aria-hidden>
                      {row.icon}
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", marginBottom: "0.1rem" }}>
                      {row.label}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.9rem" }}>{row.value}</div>
                  </div>
                </>
              );

              const rowStyle = { display: "flex", alignItems: "center", gap: "1rem" } as const;

              return row.href ? (
                <a
                  key={row.label}
                  href={row.href}
                  target={row.href.startsWith("http") ? "_blank" : undefined}
                  rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={rowStyle}
                >
                  {inner}
                </a>
              ) : (
                <div key={row.label} style={rowStyle}>
                  {inner}
                </div>
              );
            })}
          </div>

          {/* ── WhatsApp support card ──────────────────── */}
          <div
            style={{
              background: "rgba(0,0,0,0.22)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem 1.5rem",
              border: "1px solid rgba(255,255,255,0.15)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignSelf: "center",
            }}
          >
            <h3 style={{ color: "#fff", fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.35rem" }}>
              WhatsApp Support
            </h3>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Get instant support and product information
            </p>
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                background: "#25D366",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                padding: "0.75rem 1.4rem",
                borderRadius: "var(--radius-sm)",
                boxShadow: "0 6px 16px rgba(37, 211, 102, 0.35)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.176a.5.5 0 0 0 .611.611l5.308-1.47A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.687-.525-5.21-1.44l-.374-.222-3.881 1.075 1.075-3.88-.222-.374A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
