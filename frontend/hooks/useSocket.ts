"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export interface FileEventPayload {
    endpointId: string;
    eventType: "CREATED" | "MODIFIED" | "DELETED" | "RENAMED";
    filePath: string;
    fileExtension?: string;
    fileSizeBytes?: number;
    entropyBefore?: number;
    entropyAfter?: number;
    riskScore?: number;
    detectedAt: string;
}

export interface AlertPayload {
    _id: string;
    endpointId: string;
    hostname: string;
    severity: "low" | "medium" | "high" | "critical";
    riskScore: number;
    title: string;
    description?: string;
    evidence: {
        affectedFiles: string[];
        fileModificationCount?: number;
        entropyReadings: { filePath: string; entropyBefore: number; entropyAfter: number }[];
        suspiciousProcess?: { pid: number; name: string; executablePath: string; cpuUsage: number };
        ransomNotes: string[];
    };
    status: "new" | "investigating" | "resolved" | "false_positive";
    createdAt: string;
    updatedAt: string;
}

interface UseSocketResult {
    connected: boolean;
    fileEvents: FileEventPayload[];
    alerts: AlertPayload[];
    acknowledgeAlert: (alertId: string) => void;
}

/**
 * Connects to the backend as an authenticated dashboard client,
 * joins the "dashboard" room, and accumulates live fileEvent/alert
 * broadcasts in local state for consuming components to render.
 */
export function useSocket(): UseSocketResult {
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [fileEvents, setFileEvents] = useState<FileEventPayload[]>([]);
    const [alerts, setAlerts] = useState<AlertPayload[]>([]);

    useEffect(() => {
        const token = getToken();

        const socket = io(SOCKET_URL, {
            query: { clientType: "dashboard" },
            auth: { token },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            socket.emit("dashboard:join");
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        socket.on("dashboard:fileEvent", (data: FileEventPayload) => {
            setFileEvents((prev) => [data, ...prev].slice(0, 200));
        });

        socket.on("dashboard:alert", (data: AlertPayload) => {
            setAlerts((prev) => [data, ...prev]);
        });

        socket.on("dashboard:alertUpdated", (data: AlertPayload) => {
            setAlerts((prev) => {
                const exists = prev.some((a) => a._id === data._id);
                return exists ? prev.map((a) => (a._id === data._id ? data : a)) : [data, ...prev];
            });
        });
        return () => {
            socket.disconnect();
        };
    }, []);

    const acknowledgeAlert = useCallback((alertId: string) => {
        socketRef.current?.emit("alert:acknowledge", alertId);
    }, []);

    return { connected, fileEvents, alerts, acknowledgeAlert };
}