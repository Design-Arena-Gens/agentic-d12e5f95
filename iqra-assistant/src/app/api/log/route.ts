import { NextResponse } from "next/server";
import { appendCallLog, readCallLogs } from "@/lib/call-log";
import type { CallUrgency } from "@/types/call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = await readCallLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Failed to read call logs", error);
    return NextResponse.json({ logs: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      caller: string;
      callerNumber?: string;
      topic: string;
      summary: string;
      durationSeconds: number;
      urgency: CallUrgency;
    };

    if (!body?.caller || !body?.summary) {
      return NextResponse.json(
        { error: "Caller and summary are required." },
        { status: 400 },
      );
    }

    const log = await appendCallLog({
      caller: body.caller,
      callerNumber: body.callerNumber,
      topic: body.topic ?? "General Inquiry",
      summary: body.summary,
      durationSeconds: Number.isFinite(body.durationSeconds)
        ? body.durationSeconds
        : 0,
      urgency: body.urgency ?? "routine",
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Failed to append call log", error);
    return NextResponse.json(
      { error: "Failed to save call log." },
      { status: 500 },
    );
  }
}
