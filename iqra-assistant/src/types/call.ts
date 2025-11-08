export type NotificationStatus = "sent" | "skipped" | "error";

export type NotificationChannel = "whatsapp" | "email" | "console";

export type NotificationRecord = {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  summary: string;
  timestamp: string;
  status: NotificationStatus;
  error?: string;
};

export type CallUrgency = "urgent" | "routine" | "spam";

export type CallLogRecord = {
  id: string;
  caller: string;
  callerNumber?: string;
  topic: string;
  summary: string;
  timestamp: string;
  durationSeconds: number;
  urgency: CallUrgency;
};
