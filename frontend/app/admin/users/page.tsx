"use client";

import { useEffect, useState } from "react";

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: "USER" | "ADMIN";
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("vetworld_token");
            const res = await fetch("http://localhost:8080/api/admin/users", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to permanently delete this user account?")) return;
        try {
            const token = localStorage.getItem("vetworld_token");
            const res = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
                method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to delete user");
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err: any) { alert(err.message); }
    };

    const handleRoleChange = async (id: number, currentRole: string) => {
        const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            const token = localStorage.getItem("vetworld_token");
            const res = await fetch(`http://localhost:8080/api/admin/users/${id}/role`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ role: newRole })
            });
            if (!res.ok) throw new Error("Failed to update user role");
            const updatedUser = await res.json();
            setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
        } catch (err: any) { alert(err.message); }
    };

    return (
        <div style={{ paddingBottom: "3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>Users</h1>
                    <p style={{ color: "var(--text-secondary)" }}>Manage customer and admin accounts</p>
                </div>
            </div>

            {error && <div style={{ color: "rgb(239, 68, 68)", padding: "1rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem" }}>Error: {error}</div>}

            {isLoading ? (
                <div style={{ color: "var(--text-secondary)" }}>Loading users...</div>
            ) : (
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", overflow: "hidden", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
                        <thead>
                            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>ID</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Name</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>Contact</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", textAlign: "center" }}>Role</th>
                                <th style={{ padding: "1rem", fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>#{user.id}</td>
                                    <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{user.email}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{user.phone || "No phone"}</div>
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "center" }}>
                                        <button
                                            onClick={() => handleRoleChange(user.id, user.role)}
                                            style={{
                                                background: user.role === "ADMIN" ? "rgba(139, 92, 246, 0.15)" : "var(--bg)",
                                                color: user.role === "ADMIN" ? "rgb(139, 92, 246)" : "var(--text-secondary)",
                                                border: `1px solid ${user.role === "ADMIN" ? "rgba(139, 92, 246, 0.3)" : "var(--border)"}`,
                                                padding: "0.4rem 0.8rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600,
                                                cursor: "pointer", transition: "all var(--transition)"
                                            }}
                                            title="Click to toggle role"
                                        >
                                            {user.role}
                                        </button>
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            style={{
                                                background: "rgba(239, 68, 68, 0.1)", color: "rgb(239, 68, 68)", border: "none",
                                                padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 600,
                                                cursor: "pointer", transition: "all var(--transition)"
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No users registered.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
