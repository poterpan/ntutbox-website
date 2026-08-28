import { COMPARISON } from "@/content/site";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

/* 差異化區塊：與學校官方 App 的客觀功能對比。
   min-w 讓窄螢幕可橫向捲動，避免三欄擠爆（與截圖 carousel 同策略）。 */
export function Comparison() {
  return (
    <section id="why" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
      <SectionHeading
        eyebrow={COMPARISON.eyebrow}
        title={COMPARISON.title}
        description={COMPARISON.intro}
      />
      <div className="glass-soft mt-10 overflow-x-auto rounded-3xl">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[1fr_1.5fr_1.3fr] border-b border-[var(--ink)]/8 text-sm">
            <div className="px-5 py-4" />
            <div className="px-5 py-4 font-semibold text-[var(--accent-ink)]">
              {COMPARISON.ntutboxLabel}
            </div>
            <div className="px-5 py-4 font-semibold text-[var(--ink)]">
              {COMPARISON.officialLabel}
            </div>
          </div>
          {COMPARISON.rows.map((r, i) => (
            <div
              key={r.label}
              className={cn(
                "grid grid-cols-[1fr_1.5fr_1.3fr] text-sm",
                i > 0 && "border-t border-[var(--ink)]/8",
              )}
            >
              <div className="px-5 py-4 font-medium text-[var(--ink-faint)]">{r.label}</div>
              <div className="px-5 py-4 text-[var(--ink)]">{r.ntutbox}</div>
              <div className="px-5 py-4 text-[var(--ink-soft)]">{r.official}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-[13px] text-[var(--ink-faint)]">
        {COMPARISON.footnote}
      </p>
    </section>
  );
}
