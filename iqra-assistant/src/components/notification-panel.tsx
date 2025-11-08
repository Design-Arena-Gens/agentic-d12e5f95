'use client';

import { useEffect } from "react";
import { useClientState } from "@/store/client-state";
import type { NotificationRecord } from "@/types/call";

const fetchNotifications = async (): Promise<NotificationRecord[]> => {
  try {
    const res = await fetch("/api/notify", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      return [];
    }

    const payload = await res.json();
    return payload.notifications ?? [];
  } catch {
    return [];
  }
};

export default function NotificationPanel() {
  const { notifications, hydrateNotifications } = useClientState();

  useEffect(() => {
    fetchNotifications().then((serverNotifs) => {
      if (serverNotifs.length) {
        hydrateNotifications(serverNotifs);
      }
    });
  }, [hydrateNotifications]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-emerald-500/10 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Immediate Alerts</h2>
          <p className="text-xs text-slate-300">
            Iqra notifies Syed Eman Ali Shah when a call needs attention.
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {notifications.length === 0 && (
          <p className="rounded-2xl bg-slate-900/60 px-5 py-4 text-sm text-slate-300">
            No escalations yet. Iqra will alert you here for urgent callers.
          </p>
        )}
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-slate-400">
              <span>{notification.channel}</span>
              <span>
                {new Date(notification.timestamp).toLocaleString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-100">{notification.summary}</p>
            <p className="mt-2 text-xs text-slate-400">
              Recipient: <span className="text-slate-200">{notification.recipient}</span>
            </p>
            <p className="mt-1 text-xs text-emerald-300">
              Status: {notification.status}
            </p>
            {notification.error && (
              <p className="mt-1 text-xs text-rose-300/90">
                {notification.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
