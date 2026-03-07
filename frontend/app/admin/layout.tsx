"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Basic client-side check. In a real app, you'd verify the token with the backend.
        const token = localStorage.getItem("vetworld_token");
        if (!token) {
            router.push("/");
            return;
        }

        // Check JWT payload to see if role is ADMIN or if it's the hardcoded admin
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));

            // The token from AdminController login only has "sub": "admin"
            // The token from AuthController login has roles/role depending on configuration
            const isHardcodedAdmin = payload.sub === 'admin';
            const hasAdminRole = payload.roles?.includes('ROLE_ADMIN') || payload.role === 'ADMIN' || payload.role === 'ROLE_ADMIN';

            if (isHardcodedAdmin || hasAdminRole) {
                setIsAuthorized(true);
            } else {
                router.push("/");
            }
        } catch (e) {
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
