import type { NextConfig } from "next";

// BACKEND_API_URL  → set this in Vercel Environment Variables (no NEXT_PUBLIC prefix needed,
//                    since rewrites run server-side and the value never reaches the browser)
// NEXT_PUBLIC_API_URL → legacy fallback (also works, but is exposed to the browser bundle)
// http://localhost:8080  → default for local development
const backendApiUrl =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        // Legacy/plural category links (e.g. /categories/2) — the single
        // category page lives at /category/[id]. Only matches when an id
        // follows, so the /categories listing page keeps working.
        source: "/categories/:id",
        destination: "/category/:id",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
