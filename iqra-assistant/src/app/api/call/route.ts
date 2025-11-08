import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

type Message = {
  role: "assistant" | "user";
  content: string;
  language?: "en" | "ur" | "mixed";
};

const SYSTEM_MESSAGE = `
You are Iqra, a graceful bilingual AI call-handling assistant for Syed Eman Ali Shah.
Tone: gentle, confident, emotionally attuned. Blend Urdu and English naturally.

Always respond with a JSON object like:
{
  "reply": "combined bilingual response",
  "replyUrdu": "pure Urdu phrasing",
  "replyEnglish": "pure English phrasing",
  "language": "ur" | "en" | "mixed",
  "urgency": "urgent" | "routine" | "spam",
  "topic": "short topic label (<=6 words)",
  "summary": "concise running summary for internal log",
  "notificationSummary": "1 sentence summary for human notification"
}

Guidelines:
- If the caller sounds urgent, business critical, or time-sensitive, set urgency to "urgent".
- If the caller is casual or not relevant to Eman, set urgency to "routine".
- If the caller is spam or irrelevant promotional content, set urgency to "spam".
- Provide empathetic, professional responses with subtle warmth.
- Default to "mixed" language if the caller blends Urdu & English.
- Keep notificationSummary strictly 1 or 2 sentences and only include if urgency is "urgent".
- Keep summary <= 3 sentences, referencing facts shared so far.
`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages: Message[];
      callerName?: string;
      callerNumber?: string;
      callId?: string;
    };

    if (!body?.messages?.length) {
      return NextResponse.json(
        { error: "Conversation history required." },
        { status: 400 },
      );
    }

    if (openaiClient) {
      try {
        const completion = await openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.6,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_MESSAGE },
            ...body.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          ],
        });

        const content =
          completion.choices?.[0]?.message?.content ?? "{}";
        const parsed = safeParse(content);
        return NextResponse.json(parsed);
      } catch (error) {
        console.error("OpenAI fallback triggered", error);
      }
    }

    const heuristic = heuristics(body.messages, body.callerName);
    return NextResponse.json(heuristic);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process call." },
      { status: 500 },
    );
  }
}

function safeParse(payload: string) {
  try {
    return JSON.parse(payload);
  } catch (error) {
    console.error("Failed to parse model response", error, payload);
    return heuristics([], undefined);
  }
}

function heuristics(messages: Message[], callerName?: string) {
  const lastMessage = messages.at(-1)?.content ?? "";
  const urgency = classifyUrgency(lastMessage);
  const topic = inferTopic(lastMessage);
  const summary = buildSummary(callerName ?? "Caller", lastMessage, topic);
  const bilingualReply = composeReply(lastMessage, urgency, callerName);

  return {
    reply: bilingualReply.mixed,
    replyUrdu: bilingualReply.urdu,
    replyEnglish: bilingualReply.english,
    language: bilingualReply.language,
    urgency,
    topic,
    summary,
    notificationSummary:
      urgency === "urgent"
        ? `${callerName ?? "Caller"} needs attention regarding ${topic.toLowerCase()}.`
        : undefined,
  };
}

function classifyUrgency(message: string): "urgent" | "routine" | "spam" {
  const lower = message.toLowerCase();
  if (
    /(urgent|emergency|immediately|deadline|critical|issue|problem|delay)/.test(lower)
  ) {
    return "urgent";
  }
  if (/(offer|lottery|discount|win|promo|marketing|advertisement)/.test(lower)) {
    return "spam";
  }
  return "routine";
}

function inferTopic(message: string) {
  const lower = message.toLowerCase();
  if (/(payment|invoice|bill|amount)/.test(lower)) return "Payment Follow-up";
  if (/(shipment|delivery|logistics|package)/.test(lower)) return "Logistics Update";
  if (/(meeting|schedule|appointment|call)/.test(lower)) return "Scheduling";
  if (/(complaint|issue|problem|fault)/.test(lower)) return "Support Concern";
  if (/(greetings|hello|salam|assalamualaikum)/.test(lower)) return "Greetings";
  return "General Inquiry";
}

function buildSummary(caller: string, message: string, topic: string) {
  if (!message) {
    return `${caller} opened the conversation. Awaiting more details.`;
  }
  return `${caller} discussed ${topic.toLowerCase()}. Key details: ${message.trim().slice(0, 180)}`;
}

function composeReply(
  message: string,
  urgency: "urgent" | "routine" | "spam",
  callerName?: string,
) {
  const politeClose = urgency === "spam"
    ? "Shukriya call karne ka. Aaj ke liye itna hi, Allah Hafiz."
    : "Meherbani karkay mujhe zaroori tafseelat de dein, main foran Eman sahib ko update karungi.";
  const reassurance =
    urgency === "urgent"
      ? "Main foran Syed Eman Ali Shah ko inform karungi aur woh jaldi aap se rabta karenge."
      : "Main aapki baat note kar rahi hoon aur Eman sahib ko detail mein bataungi.";

  const reassuranceEn =
    urgency === "urgent"
      ? "I will alert Syed Eman Ali Shah immediately so he can reach you soon."
      : "I am logging your request and will brief Syed Eman Ali Shah in detail.";

  const mixed = `Ji ${callerName ?? "janaab"}, aapki baat sun kar shukriya. ${reassurance} ${
    urgency === "spam"
      ? "Is call ko hum gracefully conclude kar rahe hain."
      : "Kya aap kuch aur add karna chahein ge?"
  }`;

  const urdu = `Ji ${callerName ?? "janaab"}, aapki baat sun li hai. ${reassurance} ${politeClose}`;
  const english = `Thank you ${callerName ?? "dear caller"}, I have captured your message. ${reassuranceEn}`;

  let language: "en" | "ur" | "mixed" = "mixed";
  if (!/[ء-ی]/.test(message) && /[a-zA-Z]/.test(message)) language = "en";
  if (/[ء-ی]/.test(message) && !/[a-zA-Z]/.test(message)) language = "ur";

  return { mixed, urdu, english, language };
}
