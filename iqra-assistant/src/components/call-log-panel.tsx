'use client';

import { useEffect, useState } from "react";
import { useClientState } from "@/store/client-state";
import type { CallLogRecord, CallUrgency } from "@/types/call";

export default function CallLogPanel() {
  const { callLogs, hydrateCallLogs } = useClientState();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/log", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) return;
        const payload = await res.json();
        hydrateCallLogs((payload.logs ?? []) as CallLogRecord[]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [hydrateCallLogs]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Call Journal</h2>
          <p className="text-xs text-slate-300">
            Every interaction is logged with sentiment, topic, and urgency.
          </p>
        </div>
        {isLoading && (
          <span className="text-xs uppercase tracking-widest text-emerald-300">
            syncing…
          </span>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {callLogs.length === 0 && !isLoading && (
          <p className="rounded-2xl bg-slate-900/60 px-5 py-4 text-sm text-slate-300">
            Call log is empty. Incoming calls will be archived here automatically.
          </p>
        )}
        {callLogs.map((log) => (
          <div
            key={log.id}
            className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
              <span>
                {new Date(log.timestamp).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span>{formatDuration(log.durationSeconds)}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {log.caller}{" "}
              {log.callerNumber && (
                <span className="text-xs font-normal text-slate-400">
                  ({log.callerNumber})
                </span>
              )}
            </p>
            <p className="mt-2 text-sm text-slate-200">{log.summary}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Topic: {log.topic}</span>
              <span className={badgeTone(log.urgency)}>{log.urgency}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function badgeTone(urgency: CallUrgency) {
  if (urgency === "urgent") return "text-rose-200";
  if (urgency === "spam") return "text-amber-200";
  return "text-emerald-200";
}

function formatDuration(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return "—";
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}
