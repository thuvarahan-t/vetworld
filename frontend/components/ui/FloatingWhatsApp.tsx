"use client";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

export default function FloatingWhatsApp() {
    const controls = useAnimation();

    useEffect(() => {
        // Continuous gentle pulse animation
        controls.start({
            scale: [1, 1.08, 1],
            rotate: [0, -5, 5, -2, 2, 0],
            transition: {
                duration: 2.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 1.5 // Pause between animations
            }
        });
    }, [controls]);

    const handleWhatsAppClick = () => {
        const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "1234567890";
        const message = encodeURIComponent("Hello VetWorld! I have an inquiry.");
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    };

    return (
        <motion.button
            onClick={handleWhatsAppClick}
            animate={controls}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            style={{
                position: "fixed",
                bottom: "2rem",
                right: "2rem", // Right bottom corner
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#25D366", // Official WhatsApp green
                color: "#fff",
                border: "none",
                boxShadow: "0 6px 16px rgba(37, 211, 102, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 9999, // Ensure it's always on top
            }}
            aria-label="Contact us on WhatsApp"
        >
            <WhatsAppIcon size={32} />

            {/* Optional glow effect behind it */}
            <motion.div
                animate={{
                    boxShadow: [
                        "0 0 0 0 rgba(37, 211, 102, 0.4)",
                        "0 0 0 15px rgba(37, 211, 102, 0)",
                    ],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    pointerEvents: "none",
                }}
            />
        </motion.button>
    );
}

function WhatsAppIcon({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L.057 23.176a.5.5 0 0 0 .611.611l5.308-1.47A11.954 11.954 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.687-.525-5.21-1.44l-.374-.222-3.881 1.075 1.075-3.88-.222-.374A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
    );
}
