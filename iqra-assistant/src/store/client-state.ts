'use client';

import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  CallLogRecord,
  NotificationRecord,
} from "@/types/call";

export type CallMessage = {
  id: string;
  role: "system" | "assistant" | "user";
  content: string;
  language?: "en" | "ur" | "mixed";
  timestamp: string;
};

type ClientState = {
  notifications: NotificationRecord[];
  callLogs: CallLogRecord[];
  addNotification: (notification: Omit<NotificationRecord, "id" | "timestamp">) => void;
  hydrateNotifications: (notifications: NotificationRecord[]) => void;
  hydrateCallLogs: (logs: CallLogRecord[]) => void;
  prependCallLog: (log: CallLogRecord) => void;
};

export const useClientState = create<ClientState>((set) => ({
  notifications: [],
  callLogs: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: nanoid(),
          timestamp: new Date().toISOString(),
        },
        ...state.notifications,
      ].slice(0, 25),
    })),
  hydrateNotifications: (notifications) =>
    set({
      notifications,
    }),
  hydrateCallLogs: (logs) =>
    set({
      callLogs: logs,
    }),
  prependCallLog: (log) =>
    set((state) => ({
      callLogs: [log, ...state.callLogs].slice(0, 50),
    })),
}));
