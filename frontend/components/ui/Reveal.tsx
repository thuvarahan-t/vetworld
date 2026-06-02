"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* ── Scroll-triggered reveal wrapper ──────────────────────────
   Fades + slides its children up when they scroll into view.
   `once` so the animation plays a single time per element, and a
   small `amount` threshold so it triggers slightly before the
   block is fully on screen. Optional `delay` lets callers stagger
   adjacent sections. */

interface Props {
  children: ReactNode;
  delay?: number;
}

export default function Reveal({ children, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
