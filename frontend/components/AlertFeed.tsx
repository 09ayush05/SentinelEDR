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

const statusOptions: AlertPayload["status"][] = [
    "new",
    "investigating",
    "resolved",
    "false_positive",
];

interface AlertFeedProps {
    liveAlerts: AlertPayload[];
    connected: boolean;
    onAcknowledge: (alertId: string) => void;
}

export default function AlertFeed({ liveAlerts, connected, onAcknowledge }: AlertFeedProps) {
    const [historyAlerts, setHistoryAlerts] = useState<AlertPayload[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [localOverrides, setLocalOverrides] = useState<Record<string, AlertPayload["status"]>>({});

    useEffect(() => {
        apiFetch<AlertPayload[]>("/api/alerts")
            .then(setHistoryAlerts)
            .catch(() => {
                // Non-fatal: live alerts will still show even if history fails to load
            })
            .finally(() => setLoading(false));
    }, []);

    // Merge live + history, de-duplicating by _id, live alerts take precedence
    const merged = new Map<string, AlertPayload>();
    for (const a of historyAlerts) merged.set(a._id, a);
    for (const a of liveAlerts) merged.set(a._id, a);
    const alerts = Array.from(merged.values())
        .map((a) => (localOverrides[a._id] ? { ...a, status: localOverrides[a._id] } : a))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    function toggleExpanded(id: string) {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function updateStatus(id: string, status: AlertPayload["status"]) {
        setUpdatingIds((prev) => new Set(prev).add(id));
        try {
            await apiFetch(`/api/alerts/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            setLocalOverrides((prev) => ({ ...prev, [id]: status }));
            if (status === "investigating") {
                onAcknowledge(id);
            }
        } catch {
            // Silently ignore - alert stays at its previous status on failure
        } finally {
            setUpdatingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }

    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className="text-xs text-slate-400">{connected ? "Live" : "Disconnected"}</span>
            </div>

            {loading && <p className="text-sm text-slate-400">Loading alert history...</p>}

            {!loading && alerts.length === 0 && (
                <p className="text-sm text-slate-400">No alerts yet.</p>
            )}

            <div className="space-y-3">
                {alerts.map((alert) => {
                    const isExpanded = expandedIds.has(alert._id);
                    const isUpdating = updatingIds.has(alert._id);
                    const hasEvidence =
                        (alert.evidence?.entropyReadings?.length ?? 0) > 0 ||
                        (alert.evidence?.ransomNotes?.length ?? 0) > 0 ||
                        !!alert.evidence?.suspiciousProcess ||
                        (alert.evidence?.affectedFiles?.length ?? 0) > 0;

                    return (
                        <div
                            key={alert._id}
                            className={`rounded-lg border transition ${severityStyles[alert.severity]}`}
                        >
                            <button
                                type="button"
                                onClick={() => toggleExpanded(alert._id)}
                                className="w-full p-4 text-left"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wide">
                                                {alert.severity}
                                            </span>
                                            <span className="text-xs text-slate-400">score {alert.riskScore}</span>
                                            {hasEvidence && (
                                                <span className="text-xs text-slate-500">
                                                    {isExpanded ? "▾ hide details" : "▸ show details"}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="mt-1 font-medium">{alert.title}</h3>
                                        {alert.description && (
                                            <p className="mt-1 text-sm text-slate-400">{alert.description}</p>
                                        )}
                                        <p className="mt-2 text-xs text-slate-500">
                                            {alert.hostname} · {new Date(alert.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    <span className="shrink-0 rounded-full border border-current/30 px-2 py-0.5 text-xs">
                                        {alert.status}
                                    </span>
                                </div>
                            </button>

                            {isExpanded && (
                                <div
                                    className="border-t border-current/20 px-4 py-3 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {alert.evidence?.affectedFiles?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Affected files
                                            </p>
                                            <ul className="space-y-0.5">
                                                {alert.evidence.affectedFiles.map((f, i) => (
                                                    <li key={i} className="break-all font-mono text-xs text-slate-400">
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {alert.evidence?.entropyReadings?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Entropy readings
                                            </p>
                                            <ul className="space-y-1">
                                                {alert.evidence.entropyReadings.map((r, i) => (
                                                    <li key={i} className="text-xs text-slate-400">
                                                        <span className="font-mono">{r.filePath}</span> — before{" "}
                                                        <span className="font-semibold">{r.entropyBefore.toFixed(2)}</span>,
                                                        after <span className="font-semibold">{r.entropyAfter.toFixed(2)}</span>{" "}
                                                        (Δ {(r.entropyAfter - r.entropyBefore).toFixed(2)})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {alert.evidence?.suspiciousProcess && (
                                        <div className="mb-3">
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Suspicious process
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {alert.evidence.suspiciousProcess.name} (PID{" "}
                                                {alert.evidence.suspiciousProcess.pid}) ·{" "}
                                                {alert.evidence.suspiciousProcess.executablePath} ·{" "}
                                                {alert.evidence.suspiciousProcess.cpuUsage}% CPU
                                            </p>
                                        </div>
                                    )}

                                    {alert.evidence?.ransomNotes?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Ransom notes detected
                                            </p>
                                            <ul className="space-y-0.5">
                                                {alert.evidence.ransomNotes.map((n, i) => (
                                                    <li key={i} className="break-all font-mono text-xs text-slate-400">
                                                        {n}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {!hasEvidence && (
                                        <p className="text-xs text-slate-500">No additional evidence recorded.</p>
                                    )}

                                    <div className="mt-3 flex items-center gap-2 border-t border-current/10 pt-3">
                                        <span className="text-xs text-slate-500">Status:</span>
                                        <select
                                            value={alert.status}
                                            disabled={isUpdating}
                                            onChange={(e) =>
                                                updateStatus(alert._id, e.target.value as AlertPayload["status"])
                                            }
                                            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50"
                                        >
                                            {statusOptions.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                        {isUpdating && <span className="text-xs text-slate-500">Saving...</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}