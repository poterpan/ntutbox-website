import { ArrowUpRight } from "lucide-react";
import { ECOSYSTEM, LINKS } from "@/content/site";
import { GlassCard } from "@/components/glass/GlassCard";
import { SectionHeading } from "@/components/site/section-heading";
import { TrackedLink } from "@/components/analytics/tracked-link";

export function Ecosystem() {
  return (
    <section id="services" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
      <SectionHeading
        eyebrow="更多服務"
        title="不只是 App"
        description="北科盒子生態系的網頁服務，打開瀏覽器就能用。"
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {ECOSYSTEM.map((s) => (
          <GlassCard key={s.title} className="rounded-2xl p-0">
            {/* 這個 map 也渲染「服務狀態頁」卡；course_system_click 只給排課系統那張 */}
            <TrackedLink
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              event={
                s.href === LINKS.courseSystem
                  ? { name: "course_system_click", params: { placement: "ecosystem" } }
                  : null
              }
              className="group block p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--ink)]">{s.title}</h3>
                <ArrowUpRight
                  className="size-5 text-[var(--ink-faint)] transition-colors group-hover:text-[var(--accent-ink)]"
                  aria-hidden
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{s.description}</p>
              <p className="mt-3 text-[13px] text-[var(--ink-faint)]">{s.stats}</p>
              <p className="mt-4 text-[13px] font-medium text-[var(--accent-ink)]">{s.display}</p>
            </TrackedLink>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
