"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, getStoredUser, clearAuth, type AuthUser } from "@/lib/auth";
import { useSocket, type AlertPayload } from "@/hooks/useSocket";
import { apiFetch } from "@/lib/api";
import EndpointList from "@/components/EndpointList";
import AlertFeed from "@/components/AlertFeed";
import Sidebar from "@/components/Sidebar";
import { alertsToCSV, downloadCSV } from "@/lib/export";

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [checked, setChecked] = useState(false);
    const [exporting, setExporting] = useState(false);
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

    async function handleExport() {
        setExporting(true);
        try {
            const allAlerts = await apiFetch<AlertPayload[]>("/api/alerts");
            downloadCSV(
                `sentineledr-alerts-${new Date().toISOString().slice(0, 10)}.csv`,
                alertsToCSV(allAlerts)
            );
        } catch {
            // Export failure is non-critical; button just does nothing visible on error
        } finally {
            setExporting(false);
        }
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
            <Sidebar />

            <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4 pl-16">
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

            <div className="flex flex-wrap gap-2 border-b border-slate-800 px-6 py-3">
                <button
                    onClick={() => window.location.reload()}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
                >
                    ↻ Refresh
                </button>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                    ⭳ {exporting ? "Exporting..." : "Export Alerts (CSV)"}
                </button>
                <Link
                    href="/analytics"
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
                >
                    📊 View Analytics
                </Link>
                <Link
                    href="/reports"
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
                >
                    📄 Reports
                </Link>
            </div>

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