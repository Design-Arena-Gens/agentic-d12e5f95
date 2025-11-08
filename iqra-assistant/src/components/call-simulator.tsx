'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useVoiceEngine } from "@/hooks/use-voice-engine";
import { useClientState } from "@/store/client-state";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  language: "en" | "ur" | "mixed";
  createdAt: string;
};

type CallAnalysisResponse = {
  reply: string;
  replyUrdu: string;
  replyEnglish: string;
  language: "en" | "ur" | "mixed";
  urgency: "urgent" | "routine" | "spam";
  summary: string;
  topic: string;
  notificationSummary?: string;
  sentiment?: "positive" | "neutral" | "concerned";
};

const INITIAL_GREETING =
  "Assalamualaikum, this is Iqra, Syed Eman Ali Shah’s virtual assistant. How may I help you today?";

const CALLER_PRESETS = [
  { name: "Ayesha from Sana Textiles", number: "+92 301 1234567" },
  { name: "Bilal (Logistics Partner)", number: "+92 333 9876543" },
  { name: "Sara", number: "+92 345 5556677" },
  { name: "Unknown Caller", number: "" },
];

export default function CallSimulator() {
  const [callerName, setCallerName] = useState(CALLER_PRESETS[0]?.name ?? "");
  const [callerNumber, setCallerNumber] = useState(
    CALLER_PRESETS[0]?.number ?? "",
  );
  const [callId, setCallId] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [urgencyLabel, setUrgencyLabel] = useState<
    CallAnalysisResponse["urgency"] | null
  >(null);
  const [summary, setSummary] = useState<string>("");
  const [topic, setTopic] = useState<string>("General Inquiry");
  const [callStart, setCallStart] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const { speak, supported: ttsSupported } = useVoiceEngine();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { prependCallLog, addNotification } = useClientState();

  const callActiveLabel = isCallActive ? "CALL IN PROGRESS" : "STANDBY";

  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
    setCallDuration(0);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, [callDuration]);

  const handleIncomingCall = (presetIndex = 0) => {
    const preset = CALLER_PRESETS[presetIndex];
    if (preset) {
      setCallerName(preset.name);
      setCallerNumber(preset.number);
    }
    setCallId(nanoid());
    setIsCallActive(true);
    setCallStart(Date.now());
    const greeting: Message = {
      id: nanoid(),
      role: "assistant",
      content: INITIAL_GREETING,
      language: "mixed",
      createdAt: new Date().toISOString(),
    };
    setConversation([greeting]);
    setUrgencyLabel(null);
    setSummary("");
    setTopic("General Inquiry");
    if (ttsSupported) {
      speak(greeting.content, "mixed");
    }
  };

  const resetCall = () => {
    setIsCallActive(false);
    setCallId(null);
    setConversation([]);
    setInput("");
    setUrgencyLabel(null);
    setSummary("");
    setTopic("General Inquiry");
    setCallStart(null);
    setCallDuration(0);
  };

  const handleSend = async () => {
    if (!input.trim() || !isCallActive || !callId) return;

    const callerMessage: Message = {
      id: nanoid(),
      role: "user",
      content: input.trim(),
      language: detectLanguage(input),
      createdAt: new Date().toISOString(),
    };

    const updatedConversation = [...conversation, callerMessage];
    setConversation(updatedConversation);
    setInput("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callId,
          callerName,
          callerNumber,
          messages: updatedConversation.map(({ role, content, language }) => ({
            role,
            content,
            language,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reach Iqra's brain");
      }

      const data: CallAnalysisResponse = await response.json();

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: chooseResponse(data),
        language: data.language,
        createdAt: new Date().toISOString(),
      };

      setConversation((prev) => [...prev, assistantMessage]);
      setSummary(data.summary);
      setTopic(data.topic);
      setUrgencyLabel(data.urgency);

      if (ttsSupported) {
        speak(assistantMessage.content, data.language);
      }

      if (data.urgency === "urgent" && data.notificationSummary) {
        escalateNotification({
          callId,
          callerName,
          callerNumber,
          summary: data.notificationSummary,
        });
      }
    } catch (error) {
      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content:
          "I am sorry, I faced a technical hiccup while processing that. Could you please repeat or clarify?",
        language: "en",
        createdAt: new Date().toISOString(),
      };
      setConversation((prev) => [...prev, assistantMessage]);
      if (ttsSupported) {
        speak(assistantMessage.content, "en");
      }
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const escalateNotification = async (options: {
    callId: string;
    callerName: string;
    callerNumber?: string;
    summary: string;
  }) => {
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });
      if (!res.ok) {
        throw new Error("Failed to dispatch notification");
      }

      const payload = await res.json();
      if (Array.isArray(payload.notifications)) {
        payload.notifications.forEach(
          (notification: {
            channel: "whatsapp" | "email" | "console";
            recipient: string;
            summary: string;
            status: "sent" | "skipped" | "error";
            error?: string;
          }) => {
            addNotification(notification);
          },
        );
      }
    } catch (error) {
      console.error(error);
      addNotification({
        channel: "console",
        recipient: "Local log",
        summary: `Notification failed for ${options.callerName}: ${(error as Error).message}`,
        status: "error",
      });
    }
  };

  const handleEndCall = async () => {
    if (!callId) {
      resetCall();
      return;
    }
    setIsProcessing(true);
    const callEnd = Date.now();
    const durationSeconds =
      callStart && Number.isFinite(callStart) ? Math.max(1, Math.round((callEnd - callStart) / 1000)) : callDuration;
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId,
          caller: callerName,
          callerNumber,
          topic,
          summary,
          durationSeconds,
          urgency: urgencyLabel ?? "routine",
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload.log) {
          prependCallLog(payload.log);
        }
      }
    } catch (error) {
      console.error("Failed to save call log", error);
    } finally {
      setIsProcessing(false);
      resetCall();
    }
  };

  const renderMessage = (message: Message) => {
    const isAssistant = message.role === "assistant";
    return (
      <div
        key={message.id}
        className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
      >
        <div
          className={`max-w-full rounded-3xl px-5 py-3 text-sm leading-relaxed transition ${
            isAssistant
              ? "bg-emerald-500/20 text-emerald-50"
              : "bg-slate-800/80 text-slate-100"
          }`}
        >
          {message.content}
        </div>
        <span className="mt-1 text-xs uppercase tracking-widest text-slate-500">
          {isAssistant ? "Iqra" : callerName}
        </span>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-emerald-500/20 backdrop-blur">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
      <div className="relative z-10 flex flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">
                {callActiveLabel}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                {isCallActive ? callerName : "Awaiting next caller"}
              </h2>
              {isCallActive ? (
                callerNumber && (
                  <p className="text-sm text-slate-300">{callerNumber}</p>
                )
              ) : (
                <p className="text-sm text-slate-400">
                  Tap any caller preset to let Iqra answer instantly.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex h-3 w-3 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)]" />
              {formattedDuration}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {CALLER_PRESETS.map((preset, index) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleIncomingCall(index)}
                className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-widest text-slate-300 transition hover:border-emerald-400/60 hover:text-white"
              >
                Answer {preset.name}
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-col gap-4">
          <div className="max-h-[360px] space-y-4 overflow-y-auto pr-2">
            {conversation.map(renderMessage)}
          </div>
          {!isCallActive && (
            <p className="text-sm text-slate-300">
              Tap on a caller above to answer. Iqra greets them instantly, keeps
              the conversation flowing, and will summarise everything when you hang up.
            </p>
          )}
        </div>

        {isCallActive && (
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type or dictate what the caller is saying…"
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-500/30"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
                <span>Urgency: </span>
                <span className={urgencyTone(urgencyLabel)}>
                  {urgencyLabel ?? "Analysing…"}
                </span>
                <span>Topic: {topic}</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleEndCall}
                  className="rounded-full border border-rose-400/70 bg-rose-500/10 px-4 py-2 text-xs uppercase tracking-widest text-rose-200 transition hover:bg-rose-500/20"
                >
                  End Call
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isProcessing}
                  className="rounded-full border border-emerald-400/70 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-widest text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-slate-400"
                >
                  {isProcessing ? "Listening…" : "Send Update"}
                </button>
              </div>
            </div>
          </div>
        )}

        {summary && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-50">
            <p className="text-xs uppercase tracking-widest text-emerald-200">
              Running Summary
            </p>
            <p className="mt-2 leading-relaxed">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function urgencyTone(urgency: CallAnalysisResponse["urgency"] | null) {
  if (!urgency) return "text-slate-400";
  if (urgency === "urgent") return "text-rose-200";
  if (urgency === "spam") return "text-amber-200";
  return "text-emerald-200";
}

function detectLanguage(text: string): Message["language"] {
  const urduRegex = /[ء-ی]/;
  const englishRegex = /[a-zA-Z]/;
  const hasUrdu = urduRegex.test(text);
  const hasEnglish = englishRegex.test(text);
  if (hasUrdu && hasEnglish) return "mixed";
  if (hasUrdu) return "ur";
  return "en";
}

function chooseResponse(analysis: CallAnalysisResponse) {
  if (analysis.language === "ur") return analysis.replyUrdu ?? analysis.reply;
  if (analysis.language === "en") return analysis.replyEnglish ?? analysis.reply;
  return analysis.reply;
}
