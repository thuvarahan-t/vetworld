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

        // Set the JWT as an HttpOnly, Secure, SameSite=Strict cookie.
        // SameSite=Strict is the CSRF defense: a cross-site forged request cannot
        // carry this cookie, so it reaches the backend unauthenticated and is rejected.
        cookieStore.set("vetworld_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 86400, // 24 hours
        });

        return NextResponse.json(
            { success: true },
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

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
}
