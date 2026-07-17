"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import type { AlertPayload } from "@/hooks/useSocket";

interface Endpoint {
    _id: string;
    hostname: string;
    currentRiskScore: number;
    status: string;
}

const severityOrder: AlertPayload["severity"][] = ["critical", "high", "medium", "low"];
const severityColors: Record<AlertPayload["severity"], string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-amber-500",
    low: "bg-slate-500",
};

export default function AnalyticsPage() {
    const [alerts, setAlerts] = useState<AlertPayload[]>([]);
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch<AlertPayload[]>("/api/alerts"),
            apiFetch<Endpoint[]>("/api/endpoints"),
        ])
            .then(([a, e]) => {
                setAlerts(a);
                setEndpoints(e);
            })
            .finally(() => setLoading(false));
    }, []);

    const severityCounts = severityOrder.map((sev) => ({
        severity: sev,
        count: alerts.filter((a) => a.severity === sev).length,
    }));
    const maxSeverityCount = Math.max(1, ...severityCounts.map((s) => s.count));

    const statusList: AlertPayload["status"][] = ["new", "investigating", "resolved", "false_positive"];
    const statusCounts = statusList.map((s) => ({
        status: s,
        count: alerts.filter((a) => a.status === s).length,
    }));

    const avgRisk =
        endpoints.length > 0
            ? Math.round(endpoints.reduce((sum, e) => sum + e.currentRiskScore, 0) / endpoints.length)
            : 0;
    const onlineCount = endpoints.filter((e) => e.status === "online").length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Sidebar />
            <header className="border-b border-slate-800 px-6 py-4 pl-16">
                <h1 className="text-lg font-semibold">Analytics</h1>
            </header>

            <main className="p-6">
                {loading ? (
                    <p className="text-sm text-slate-400">Loading analytics...</p>
                ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Total alerts</p>
                            <p className="mt-1 text-3xl font-semibold">{alerts.length}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Endpoints online</p>
                            <p className="mt-1 text-3xl font-semibold">
                                {onlineCount} / {endpoints.length}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Avg endpoint risk score</p>
                            <p className="mt-1 text-3xl font-semibold">{avgRisk}</p>
                        </div>
                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Unresolved alerts</p>
                            <p className="mt-1 text-3xl font-semibold">
                                {alerts.filter((a) => a.status === "new" || a.status === "investigating").length}
                            </p>
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
                            <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">Alerts by severity</p>
                            <div className="space-y-2">
                                {severityCounts.map((s) => (
                                    <div key={s.severity} className="flex items-center gap-3">
                                        <span className="w-20 text-xs capitalize text-slate-400">{s.severity}</span>
                                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                                            <div
                                                className={`h-full ${severityColors[s.severity]}`}
                                                style={{ width: `${(s.count / maxSeverityCount) * 100}%` }}
                                            />
                                        </div>
                                        <span className="w-6 text-right text-xs text-slate-400">{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 lg:col-span-2">
                            <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">Alerts by status</p>
                            <div className="flex flex-wrap gap-3">
                                {statusCounts.map((s) => (
                                    <div key={s.status} className="rounded-md border border-slate-700 px-3 py-2 text-center">
                                        <p className="text-xs capitalize text-slate-400">{s.status.replace("_", " ")}</p>
                                        <p className="text-lg font-semibold">{s.count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}