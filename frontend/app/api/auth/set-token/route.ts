import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/set-token
 * Receives a JWT token from the backend login endpoint and sets it as an HttpOnly,
 * Secure, SameSite=Strict cookie. The client never handles the raw token.
 */
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token || typeof token !== "string") {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();

        // Set the JWT as an HttpOnly, Secure, SameSite=Strict cookie
        cookieStore.set("vetworld_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 86400, // 24 hours
        });

        // Also set a CSRF token (non-sensitive, sent in headers)
        const csrfToken = generateCsrfToken();
        cookieStore.set("vetworld_csrf", csrfToken, {
            httpOnly: false, // Can be read by JS for inclusion in X-CSRF-Token header
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 86400,
        });

        return NextResponse.json(
            {
                success: true,
                csrfToken, // Return CSRF token so frontend can use it
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in /api/auth/set-token:", error);
        return NextResponse.json(
            { error: "Failed to set token" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/auth/clear-token
 * Clears the auth cookies on logout
 */
export async function DELETE(request: NextRequest) {
    const cookieStore = await cookies();
    cookieStore.delete("vetworld_token");
    cookieStore.delete("vetworld_csrf");

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}

function generateCsrfToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
