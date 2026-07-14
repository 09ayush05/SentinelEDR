"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { AlertPayload } from "@/hooks/useSocket";

const severityStyles: Record<AlertPayload["severity"], string> = {
    low: "border-slate-600 bg-slate-800/50 text-slate-300",
    medium: "border-amber-600 bg-amber-950/50 text-amber-300",
    high: "border-orange-600 bg-orange-950/50 text-orange-300",
    critical: "border-red-600 bg-red-950/50 text-red-300",
};

interface AlertFeedProps {
    liveAlerts: AlertPayload[];
    connected: boolean;
    onAcknowledge: (alertId: string) => void;
}

export default function AlertFeed({ liveAlerts, connected, onAcknowledge }: AlertFeedProps) {
    const [historyAlerts, setHistoryAlerts] = useState<AlertPayload[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<AlertPayload[]>("/api/alerts")
            .then(setHistoryAlerts)
            .catch(() => {
                // Non-fatal: live alerts will still show even if history fails to load
            })
            .finally(() => setLoading(false));
    }, []);

    // Merge live + history, de-duplicating by _id, live alerts take precedence
    // (since dashboard:alertUpdated keeps them current)
    const merged = new Map<string, AlertPayload>();
    for (const a of historyAlerts) merged.set(a._id, a);
    for (const a of liveAlerts) merged.set(a._id, a);
    const alerts = Array.from(merged.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <span
                    className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <span className="text-xs text-slate-400">
                    {connected ? "Live" : "Disconnected"}
                </span>
            </div>

            {loading && <p className="text-sm text-slate-400">Loading alert history...</p>}

            {!loading && alerts.length === 0 && (
                <p className="text-sm text-slate-400">No alerts yet.</p>
            )}

            <div className="space-y-3">
                {alerts.map((alert) => (
                    <div
                        key={alert._id}
                        className={`rounded-lg border p-4 ${severityStyles[alert.severity]}`}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wide">
                                        {alert.severity}
                                    </span>
                                    <span className="text-xs text-slate-400">score {alert.riskScore}</span>
                                </div>
                                <h3 className="mt-1 font-medium">{alert.title}</h3>
                                {alert.description && (
                                    <p className="mt-1 text-sm text-slate-400">{alert.description}</p>
                                )}
                                <p className="mt-2 text-xs text-slate-500">
                                    {alert.hostname} · {new Date(alert.createdAt).toLocaleString()}
                                </p>
                                {alert.evidence?.affectedFiles?.length > 0 && (
                                    <p className="mt-1 truncate text-xs text-slate-500">
                                        {alert.evidence.affectedFiles[0]}
                                        {alert.evidence.affectedFiles.length > 1 &&
                                            ` +${alert.evidence.affectedFiles.length - 1} more`}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className="rounded-full border border-current/30 px-2 py-0.5 text-xs">
                                    {alert.status}
                                </span>
                                {alert.status === "new" && (
                                    <button
                                        onClick={() => onAcknowledge(alert._id)}
                                        className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
                                    >
                                        Investigate
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}