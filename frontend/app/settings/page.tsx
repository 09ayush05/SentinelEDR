"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function SettingsPage() {
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [soundOnAlert, setSoundOnAlert] = useState(false);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Sidebar />
            <header className="border-b border-slate-800 px-6 py-4 pl-16">
                <h1 className="text-lg font-semibold">Settings</h1>
            </header>

            <main className="max-w-lg p-6">
                <p className="mb-4 text-xs text-slate-500">
                    These preferences are stored locally in your browser for this session only — there&apos;s
                    no backend settings store yet, so they won&apos;t persist across devices or logins.
                </p>

                <div className="space-y-4">
                    <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4">
                        <div>
                            <p className="font-medium">Auto-refresh endpoint list</p>
                            <p className="text-xs text-slate-500">Not yet wired to live updates</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="h-5 w-5"
                        />
                    </label>

                    <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4">
                        <div>
                            <p className="font-medium">Sound on new critical alert</p>
                            <p className="text-xs text-slate-500">Not yet implemented</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={soundOnAlert}
                            onChange={(e) => setSoundOnAlert(e.target.checked)}
                            className="h-5 w-5"
                        />
                    </label>
                </div>
            </main>
        </div>
    );
}