"use client";

import { motion } from "framer-motion";

// A `template` (unlike `layout`) re-mounts on every navigation, so this enter
// animation fires on each tab/page switch — forwards and backwards alike —
// giving a smooth cross-fade instead of an abrupt content swap. It wraps the
// streamed page, so the skeleton fades in first, then the real content replaces
// it in place.
//
// Only `opacity` is animated — never a transform. A lingering CSS transform on
// this wrapper would become the containing block for the page's `position:fixed`
// elements (home background blobs, toasts), anchoring them to the wrapper
// instead of the viewport.
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ willChange: "opacity" }}
        >
            {children}
        </motion.div>
    );
}
