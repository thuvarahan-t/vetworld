"use client";

import { useAdminUsers, revalidateUsers } from "@/lib/adminHooks";
import { authFetcher } from "@/lib/api";

interface User { id: number; name: string; email: string; phone: string; role: "USER" | "ADMIN"; }

function TableSkeleton() {
    return (
        <>
            {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    {[40, 120, 180, 80, 80].map((w, j) => (
                        <td key={j} style={{ padding: "1rem" }}>
                            <div style={{ height: "16px", width: `${w}px`, borderRadius: "6px", background: "var(--border)", animation: "pulse 1.5s ease-in-out infinite" }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

export default function AdminUsersPage() {
    const { data: users = [], error, isLoading, mutate } = useAdminUsers();

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to permanently delete this user account?")) return;
        mutate(prev => (prev || []).filter(u => u.id !== id), { revalidate: false });
        try {
            await authFetcher(`/admin/users/${id}`, { method: "DELETE" });
            revalidateUsers();
        } catch (err: any) {
            alert(err.message);
            revalidateUsers();
        }
    };

    const handleRoleChange = async (id: number, currentRole: string) => {
        const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
        // Optimistic update
        mutate(prev => (prev || []).map(u => u.id === id ? { ...u, role: newRole as User["role"] } : u), { revalidate: false });
        try {
            const updated = await authFetcher<User>(`/admin/users/${id}/role`, {
                method: "PUT",
                body: JSON.stringify({ role: newRole }),
            });
            mutate(prev => (prev || []).map(u => u.id === id ? updated : u), { revalidate: false });
        } catch (err: any) {
            alert(err.message);
            revalidateUsers();
        }
    };

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>Users</h1>
                    <p style={{ color: "var(--text-secondary)" }}>
                        Manage customer and admin accounts
                        {!isLoading && (
                            <span style={{ marginLeft: "0.5rem", color: "var(--vet-blue)", fontWeight: 600 }}>
                                ({users.length} total)
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {error && (
                <div style={{ color: "rgb(239, 68, 68)", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>
                    ⚠ {error.message}
                </div>
            )}

            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "700px" }}>
                    <thead>
                        <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                            {["ID", "Name", "Contact", "Role", "Actions"].map((h, i) => (
                                <th key={h} style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", textAlign: i >= 3 ? "center" : "left" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? <TableSkeleton /> : users.map(user => (
                            <tr key={user.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "var(--background)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>#{user.id}</td>
                                <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</td>
                                <td style={{ padding: "1rem" }}>
                                    <div style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{user.email}</div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{user.phone || "No phone"}</div>
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                    <button onClick={() => handleRoleChange(user.id, user.role)}
                                        style={{
                                            background: user.role === "ADMIN" ? "rgba(139, 92, 246, 0.15)" : "var(--bg)",
                                            color: user.role === "ADMIN" ? "rgb(139, 92, 246)" : "var(--text-secondary)",
                                            border: `1px solid ${user.role === "ADMIN" ? "rgba(139, 92, 246, 0.3)" : "var(--border)"}`,
                                            padding: "0.4rem 0.8rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                                        }}
                                        title="Click to toggle role">
                                        {user.role}
                                    </button>
                                </td>
                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                    <button onClick={() => handleDelete(user.id)}
                                        style={{ background: "rgba(239, 68, 68, 0.1)", color: "rgb(239, 68, 68)", border: "none", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!isLoading && users.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No users registered.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
