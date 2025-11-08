# Iqra — AI Call Concierge

Iqra is an emotionally intelligent, bilingual (Urdu/English) call-handling assistant for **Syed Eman Ali Shah**. She greets every caller warmly, understands intent, and triages conversations with human-like empathy. Urgent business calls trigger real-time notifications to WhatsApp and Gmail, while every interaction is neatly logged for later review.

https://agentic-d12e5f95.vercel.app

## ✨ Highlights

- Natural Urdu/English responses with speech synthesis for Iqra’s warm voice
- Live call simulation UI with urgency classification and running summaries
- Automatic notification dispatch via WhatsApp (Twilio) and Gmail (Nodemailer)
- Persistent call journal and notification history stored on the server
- OpenAI-powered comprehension with graceful heuristic fallback

## 🚀 Quickstart

```bash
cd iqra-assistant
npm install
npm run dev
```

Visit `http://localhost:3000` and tap any caller preset to experience Iqra in action.

## 🔐 Environment Variables

Duplicate `.env.example` to `.env.local` and fill in any integrations you want to enable:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Enables neural responses & nuanced intent detection |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | Twilio credentials for WhatsApp alerts |
| `TWILIO_WHATSAPP_FROM`, `TWILIO_WHATSAPP_TO` | WhatsApp sender/receiver numbers (`whatsapp:+923...`) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `GMAIL_TO` | Gmail SMTP config for urgent email pings |

Without credentials, Iqra still runs with on-device heuristics and logs notifications as “skipped” for transparency.

## 📁 Key Files

- `src/app/page.tsx` — Landing layout with simulator, notifications, and log panels
- `src/components/call-simulator.tsx` — Conversation engine, urgency detection, TTS hooks
- `src/app/api/call/route.ts` — OpenAI (or heuristic) conversation + triage brain
- `src/app/api/log/route.ts` — Persists structured call summaries
- `src/app/api/notify/route.ts` — Dispatches WhatsApp/Gmail alerts & stores history
- `src/lib/*.ts` — File-backed persistence utilities for logs and notifications

## 🧪 Verification

```bash
npm run lint
npm run build
```

## 📦 Deployment

A production-ready Next.js build is configured for Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-d12e5f95
```

Once live, verify with:

```bash
curl https://agentic-d12e5f95.vercel.app
```

## 📝 Notes

- Speech synthesis runs in-browser via the Web Speech API; Chrome provides the most natural voices for Urdu + English.
- All server-side storage is file-based (`/data`) for simplicity. Swap in a database if you need multi-instance scalability.
- Extend `CALLER_PRESETS` in `call-simulator.tsx` to mirror your real-world contacts.

Iqra is ready to hold space for every caller—calm, confident, and always attentive.***
