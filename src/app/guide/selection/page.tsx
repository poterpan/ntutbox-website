import type { Metadata } from "next";
import { APP_NAME, GUIDE, SITE_URL } from "@/content/site";
import { GlassCard } from "@/components/glass/GlassCard";

export const metadata: Metadata = {
  title: GUIDE.metaTitle,
  description: GUIDE.metaDescription,
  alternates: { canonical: "/guide/selection/" },
  openGraph: {
    title: `${GUIDE.metaTitle} — ${APP_NAME}`,
    description: GUIDE.metaDescription,
    url: `${SITE_URL}/guide/selection/`,
  },
};

export default function GuideSelectionPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{GUIDE.title}</h1>
      <p className="mt-3 leading-7 text-[var(--ink-soft)]">{GUIDE.intro}</p>

      <div className="mt-10 space-y-4">
        {GUIDE.steps.map((s, i) => (
          <GlassCard key={s.title} className="rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-semibold text-[var(--accent-ink)]">
                {i + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[var(--ink)]">{s.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{s.body}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-10 text-center">
        <a
          href={GUIDE.courseLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-medium text-white shadow-lg shadow-[var(--accent)]/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {GUIDE.courseLink.label}
        </a>
      </div>
    </div>
  );
}
