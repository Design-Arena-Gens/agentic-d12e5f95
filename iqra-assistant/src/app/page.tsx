import CallSimulator from "@/components/call-simulator";
import NotificationPanel from "@/components/notification-panel";
import CallLogPanel from "@/components/call-log-panel";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-950 blur-3xl" />
        <header className="relative z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">
                Syed Eman Ali Shah
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Meet Iqra, Your Bilingual Call Concierge
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Iqra listens with empathy, responds with grace, and keeps you
                informed instantly in both Urdu and English.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_4px_rgba(16,185,129,0.35)]" />
              Live Status: <span className="font-semibold text-emerald-300">Ready</span>
            </div>
          </div>
        </header>
      </div>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-12 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-6">
          <CallSimulator />
        </section>
        <aside className="space-y-6">
          <NotificationPanel />
          <CallLogPanel />
        </aside>
      </main>
    </div>
  );
}
