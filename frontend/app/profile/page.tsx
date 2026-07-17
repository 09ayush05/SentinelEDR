"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

interface Me {
    _id: string;
    name: string;
    email: string;
    role: string;
    lastLogin?: string;
    createdAt?: string;
}

export default function ProfilePage() {
    const [me, setMe] = useState<Me | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiFetch<Me>("/api/auth/me")
            .then(setMe)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"));
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Sidebar />
            <header className="border-b border-slate-800 px-6 py-4 pl-16">
                <h1 className="text-lg font-semibold">Profile</h1>
            </header>

            <main className="max-w-lg p-6">
                {error && <p className="text-sm text-red-400">{error}</p>}
                {!me && !error && <p className="text-sm text-slate-400">Loading...</p>}
                {me && (
                    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-4">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
                            <p>{me.name}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                            <p>{me.email}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
                            <p className="capitalize">{me.role}</p>
                        </div>
                        {me.lastLogin && (
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500">Last login</p>
                                <p>{new Date(me.lastLogin).toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}