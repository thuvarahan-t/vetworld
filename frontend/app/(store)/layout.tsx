import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <div style={{ flexGrow: 1 }}>
                {children}
            </div>
            <Footer />
            <FloatingWhatsApp />
        </div>
    );
}