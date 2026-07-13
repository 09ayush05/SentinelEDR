"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getStoredUser, clearAuth, type AuthUser } from "@/lib/auth";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.replace("/login");
            return;
        }
        setUser(getStoredUser());
        setChecked(true);
    }, [router]);

    function handleLogout() {
        clearAuth();
        router.replace("/login");
    }

    // Avoid flashing dashboard content before the auth check resolves
    if (!checked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <p className="text-slate-400">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <h1 className="text-lg font-semibold">SentinelEDR</h1>
                <div className="flex items-center gap-4">
                    {user && <span className="text-sm text-slate-400">{user.name}</span>}
                    <button
                        onClick={handleLogout}
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                        Log out
                    </button>
                </div>
            </header>

            <main className="p-6">
                <p className="text-slate-400">
                    Auth wired up. Live endpoint list and alert feed land here in the next wave.
                </p>
            </main>
        </div>
    );
}