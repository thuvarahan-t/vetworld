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
                    <Image src="/logo2.png" alt="VetWorld logo" width={28} height={28} />
                    <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>VetWorld</p>
                </div>
                <p style={{ opacity: 0.6 }}>Your one-stop veterinary &amp; lab equipment store</p>
                <div style={{ opacity: 0.8, marginTop: "0.9rem", lineHeight: 1.7 }}>
                    <p style={{ margin: 0 }}>
                        <strong style={{ color: "#ffffff" }}>Address:</strong> 15/A, Ebenezer Place, Dehiwala, Sri Lanka
                    </p>
                    <p style={{ margin: "0.15rem 0 0" }}>
                        <strong style={{ color: "#ffffff" }}>Mobile:</strong>{" "}
                        <a href="tel:+94773300802" style={{ color: "#e2e8f0", textDecoration: "none" }}>
                            +94 77 330 0802 |
                        </a>
                        <strong style={{ color: "#ffffff" }}> WhatsApp:</strong>{" "}
                        <a href="https://wa.me/94773300802" target="_blank" rel="noopener noreferrer" style={{ color: "#e2e8f0", textDecoration: "none" }}>
                            +94 77 330 0802
                        </a>
                    </p>
                </div>
                <p style={{ opacity: 0.4, marginTop: "1rem" }}>&copy; {new Date().getFullYear()} VetWorld. All rights reserved.</p>
            </div>
        </footer>
    );
}
