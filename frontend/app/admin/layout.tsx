"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    // Authentication is handled server-side via HttpOnly cookies.
    // The server will return 401 on unauthenticated requests,
    // triggering a redirect to login in the API layer.

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
            <AdminSidebar />
            <main style={{ flex: 1, padding: "2rem 3rem", overflowY: "auto", height: "100vh" }}>
                {children}
            </main>
        </div>
    );
}
