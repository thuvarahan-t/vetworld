"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type JwtPayload = {
    sub?: string;
    role?: string;
    roles?: string[];
    exp?: number;
};

function parseJwtPayload(token: string): JwtPayload | null {
    try {
        const base64Url = token.split(".")[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        return JSON.parse(atob(padded));
    } catch {
        return null;
    }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("vetworld_token");
        if (!token) {
            router.push("/");
            return;
        }

        const payload = parseJwtPayload(token);
        if (!payload) {
            localStorage.removeItem("vetworld_token");
            localStorage.removeItem("vetworld_user");
            router.push("/");
            return;
        }

        const nowInSeconds = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp <= nowInSeconds) {
            localStorage.removeItem("vetworld_token");
            localStorage.removeItem("vetworld_user");
            router.push("/");
            return;
        }

        const isHardcodedAdmin = payload.sub === "admin";
        const hasAdminRole =
            payload.roles?.includes("ROLE_ADMIN") ||
            payload.role === "ADMIN" ||
            payload.role === "ROLE_ADMIN";

        if (isHardcodedAdmin || hasAdminRole) {
            setIsAuthorized(true);
        } else {
            localStorage.removeItem("vetworld_token");
            localStorage.removeItem("vetworld_user");
            router.push("/");
        }
    }, [router]);

    if (!isAuthorized) {
        return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Admin Dashboard...</div>;
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
            <AdminSidebar />
            <main style={{ flex: 1, padding: "2rem 3rem", overflowY: "auto", height: "100vh" }}>
                {children}
            </main>
        </div>
    );
}
