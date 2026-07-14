"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getStoredUser, clearAuth, type AuthUser } from "@/lib/auth";
import { useSocket } from "@/hooks/useSocket";
import EndpointList from "@/components/EndpointList";
import AlertFeed from "@/components/AlertFeed";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [checked, setChecked] = useState(false);
    const { connected, alerts, acknowledgeAlert } = useSocket();

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

            <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
                <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Endpoints
                    </h2>
                    <EndpointList />
                </section>

                <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Alerts
                    </h2>
                    <AlertFeed liveAlerts={alerts} connected={connected} onAcknowledge={acknowledgeAlert} />
                </section>
            </main>
        </div>
    );
}