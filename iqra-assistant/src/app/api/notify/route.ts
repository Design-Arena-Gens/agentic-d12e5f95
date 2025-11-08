import { NextResponse } from "next/server";
import { dispatchNotifications, readNotifications } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notifications = await readNotifications();
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Failed to read notifications", error);
    return NextResponse.json({ notifications: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      callId: string;
      callerName: string;
      callerNumber?: string;
      summary: string;
    };

    if (!body?.callId || !body?.callerName || !body?.summary) {
      return NextResponse.json(
        { error: "callId, callerName, and summary are required." },
        { status: 400 },
      );
    }

    const results = await dispatchNotifications({
      callId: body.callId,
      callerName: body.callerName,
      callerNumber: body.callerNumber,
      summary: body.summary,
    });

    return NextResponse.json({ notifications: results }, { status: 201 });
  } catch (error) {
    console.error("Failed to dispatch notifications", error);
    return NextResponse.json(
      { error: "Failed to send notifications." },
      { status: 500 },
    );
  }
}
