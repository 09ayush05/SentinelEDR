"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Endpoint {
    _id: string;
    endpointId: string;
    hostname: string;
    ipAddress?: string;
    osInfo?: string;
    agentVersion: string;
    status: "online" | "offline" | "warning" | "critical";
    currentRiskScore: number;
    lastSeen: string;
    watchedPaths: string[];
}

const statusColors: Record<Endpoint["status"], string> = {
    online: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    offline: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function EndpointList() {
    const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiFetch<Endpoint[]>("/api/endpoints")
            .then(setEndpoints)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load endpoints"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p className="text-sm text-slate-400">Loading endpoints...</p>;
    }

    if (error) {
        return <p className="text-sm text-red-400">{error}</p>;
    }

    if (endpoints.length === 0) {
        return <p className="text-sm text-slate-400">No endpoints registered yet.</p>;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-slate-800">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                    <tr>
                        <th className="px-4 py-2 font-medium">Hostname</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Risk Score</th>
                        <th className="px-4 py-2 font-medium">OS</th>
                        <th className="px-4 py-2 font-medium">Last Seen</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {endpoints.map((ep) => (
                        <tr key={ep._id} className="text-slate-200">
                            <td className="px-4 py-3">
                                <div className="font-medium">{ep.hostname}</div>
                                <div className="text-xs text-slate-500">{ep.endpointId}</div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={`rounded-full border px-2 py-0.5 text-xs ${statusColors[ep.status]}`}>
                                    {ep.status}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={
                                        ep.currentRiskScore >= 60
                                            ? "font-semibold text-red-400"
                                            : ep.currentRiskScore >= 30
                                                ? "font-semibold text-amber-400"
                                                : "text-slate-300"
                                    }
                                >
                                    {ep.currentRiskScore}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">{ep.osInfo || "—"}</td>
                            <td className="px-4 py-3 text-slate-400">
                                {new Date(ep.lastSeen).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}