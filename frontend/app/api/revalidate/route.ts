import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST /api/revalidate
 * Purges the cached storefront catalog (products, categories, banners) so admin
 * edits show up immediately instead of waiting for the ISR window to expire.
 *
 * Requires the auth cookie — only a logged-in admin/user can trigger it, and the
 * operation is idempotent (worst case: one extra backend fetch on next request).
 *
 * NOTE: this local route handler takes precedence over the `/api/:path*` rewrite
 * to the backend (Next checks filesystem routes before afterFiles rewrites).
 */
export async function POST() {
    const cookieStore = await cookies();
    if (!cookieStore.get("vetworld_token")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Next 16 requires a cache-life profile; "max" purges the tag's entries on demand.
    revalidateTag("catalog", "max");
    return NextResponse.json({ revalidated: true });
}
