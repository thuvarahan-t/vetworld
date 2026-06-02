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
            className="category-card-motion"
        >
            <Link href={`/category/${category.id}`} className="category-card">
                <div className="category-card-media">
                    {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} />
                    ) : (
                        <span className="category-card-fallback" aria-hidden="true" />
                    )}
                </div>
                <span className="category-card-title">{category.name}</span>
            </Link>
        </motion.div>
    );
}
