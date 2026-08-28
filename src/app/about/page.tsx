import type { Metadata } from "next";
import { ABOUT, APP_NAME, SITE_URL } from "@/content/site";

export const metadata: Metadata = {
  title: ABOUT.metaTitle,
  description: ABOUT.metaDescription,
  alternates: { canonical: "/about/" },
  openGraph: {
    title: `${ABOUT.metaTitle} — ${APP_NAME}`,
    description: ABOUT.metaDescription,
    url: `${SITE_URL}/about/`,
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{ABOUT.metaTitle}</h1>
      <p className="mt-3 leading-7 text-[var(--ink-soft)]">{ABOUT.intro}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {ABOUT.highlights.map((h) => (
          <span
            key={h}
            className="rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[13px] font-medium text-[var(--accent-ink)]"
          >
            {h}
          </span>
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {ABOUT.paragraphs.map((p, i) => (
          <p key={i} className="leading-7 text-[var(--ink-soft)]">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
