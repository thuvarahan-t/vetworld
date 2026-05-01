"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Category } from "@/types";

interface Props {
    category: Category;
}

export default function CategoryCard({ category }: Props) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ height: "100%" }}
        >
            <Link
                href={`/category/${category.id}`}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    height: "100%",
                    gap: "0.75rem",
                    background: "rgba(255, 255, 255, 0.4)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderRadius: "var(--radius-md)",
                    padding: "1.25rem 1rem",
                    textAlign: "center",
                    border: "1px solid rgba(255, 255, 255, 0.5)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255, 255, 255, 0.7)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255, 255, 255, 0.8)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255, 255, 255, 0.4)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.04)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255, 255, 255, 0.5)";
                }}
            >
                <div
                    style={{
                        width: 72, height: 72,
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                        background: "var(--vet-blue-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <span style={{ fontSize: "2rem" }}>🧬</span>
                    )}
                </div>
                <span style={{
                    fontWeight: 600, fontSize: "0.88rem",
                    color: "var(--text-primary)",
                    /* Fix mid-word truncation */
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    hyphens: "auto",
                    lineHeight: 1.35,
                    maxWidth: "100%",
                    /* Force exactly 2 lines of vertical space */
                    height: "calc(1.35em * 2)",
                    overflow: "hidden", display: "-webkit-box",
                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>
                    {category.name}
                </span>
            </Link>
        </motion.div>
    );
}
