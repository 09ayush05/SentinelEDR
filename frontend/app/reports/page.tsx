"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import { alertsToCSV, downloadCSV, downloadText } from "@/lib/export";
import type { AlertPayload } from "@/hooks/useSocket";

interface Endpoint {
    _id: string;
    endpointId: string;
    hostname: string;
    osInfo?: string;
    status: string;
    currentRiskScore: number;
    lastSeen: string;
}

export default function ReportsPage() {
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

    function exportAlertsCSV() {
        downloadCSV(`sentineledr-alerts-${new Date().toISOString().slice(0, 10)}.csv`, alertsToCSV(alerts));
    }

    function exportEndpointsCSV() {
        const headers = ["Hostname", "Endpoint ID", "Status", "Risk Score", "OS", "Last Seen"];
        const rows = endpoints.map((e) => [
            e.hostname,
            e.endpointId,
            e.status,
            String(e.currentRiskScore),
            e.osInfo ?? "",
            e.lastSeen,
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
        downloadCSV(`sentineledr-endpoints-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    }

    function exportSummaryText() {
        const critical = alerts.filter((a) => a.severity === "critical").length;
        const high = alerts.filter((a) => a.severity === "high").length;
        const lines = [
            "SentinelEDR Summary Report",
            `Generated: ${new Date().toLocaleString()}`,
            "",
            `Total endpoints: ${endpoints.length}`,
            `Online endpoints: ${endpoints.filter((e) => e.status === "online").length}`,
            `Total alerts: ${alerts.length}`,
            `Critical alerts: ${critical}`,
            `High severity alerts: ${high}`,
            "",
            "Endpoint details:",
            ...endpoints.map(
                (e) => `  - ${e.hostname} (${e.endpointId}) | ${e.status} | risk ${e.currentRiskScore}`
            ),
        ];
        downloadText(`sentineledr-summary-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Sidebar />
            <header className="border-b border-slate-800 px-6 py-4 pl-16">
                <h1 className="text-lg font-semibold">Reports</h1>
            </header>

            <main className="p-6">
                {loading ? (
                    <p className="text-sm text-slate-400">Loading data...</p>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400">
                            Generate downloadable reports from current alert and endpoint data.
                        </p>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <button
                                onClick={exportAlertsCSV}
                                className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-blue-600"
                            >
                                <p className="font-medium">Alerts CSV</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
                                </p>
                            </button>

                            <button
                                onClick={exportEndpointsCSV}
                                className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-blue-600"
                            >
                                <p className="font-medium">Endpoints CSV</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""}
                                </p>
                            </button>

                            <button
                                onClick={exportSummaryText}
                                className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-blue-600"
                            >
                                <p className="font-medium">Summary report (.txt)</p>
                                <p className="mt-1 text-xs text-slate-500">Plain-text overview</p>
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}