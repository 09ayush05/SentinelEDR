import type { AlertPayload } from "@/hooks/useSocket";

export function alertsToCSV(alerts: AlertPayload[]): string {
    const headers = ["Severity", "Score", "Status", "Title", "Hostname", "Created At", "Affected Files"];
    const rows = alerts.map((a) => [
        a.severity,
        String(a.riskScore),
        a.status,
        `"${a.title.replace(/"/g, '""')}"`,
        a.hostname,
        a.createdAt,
        `"${(a.evidence?.affectedFiles?.join("; ") ?? "").replace(/"/g, '""')}"`,
    ]);
    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadCSV(filename: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function downloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}