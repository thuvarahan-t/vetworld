import Image from "next/image";

export default function Footer() {
    return (
        <footer
            style={{
                background: "var(--text-primary)",
                color: "#e2e8f0",
                padding: "2.5rem 0",
                textAlign: "center",
                marginTop: "auto",
                fontSize: "0.875rem",
            }}
        >
            <div className="container-main">
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Image src="/logo.png" alt="VetWorld logo" width={28} height={28} />
                    <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>VetWorld</p>
                </div>
                <p style={{ opacity: 0.6 }}>Your one-stop veterinary &amp; lab equipment store</p>
                <p style={{ opacity: 0.4, marginTop: "1rem" }}>&copy; {new Date().getFullYear()} VetWorld. All rights reserved.</p>
            </div>
        </footer>
    );
}
