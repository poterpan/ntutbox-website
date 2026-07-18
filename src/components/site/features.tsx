import { COMING_SOON, MAIN_FEATURES, MORE_FEATURES } from "@/content/site";
import { GlassCard } from "@/components/glass/GlassCard";
import { SectionHeading } from "@/components/site/section-heading";

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
      <SectionHeading
        eyebrow="功能"
        title="校務日常，一個 App 搞定"
        description="從課表到選課，把最常用的校務操作放進口袋。"
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MAIN_FEATURES.map((f) => (
          <GlassCard key={f.title} className="rounded-2xl p-5">
            <f.icon className="size-6 text-[var(--accent-ink)]" aria-hidden />
            <h3 className="mt-3 text-[15px] font-semibold text-[var(--ink)]">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">{f.description}</p>
          </GlassCard>
        ))}
      </div>
      <div className="glass-soft mt-6 rounded-3xl px-6 py-8 sm:px-10">
        <h3 className="text-lg font-semibold text-[var(--ink)]">還有更多</h3>
        <ul className="mt-5 grid gap-x-10 gap-y-3.5 sm:grid-cols-2">
          {MORE_FEATURES.map((f) => (
            <li key={f.title} className="text-sm leading-6 text-[var(--ink-soft)]">
              <span className="font-medium text-[var(--ink)]">{f.title}</span>
              {f.badge && (
                <span className="ml-1.5 rounded-md bg-[var(--accent)]/10 px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent-ink)]">
                  {f.badge}
                </span>
              )}
              <span className="mx-1.5 text-[var(--ink-faint)]">—</span>
              {f.description}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[13px] text-[var(--ink-faint)]">
          即將推出：{COMING_SOON.join("、")}
        </p>
      </div>
    </section>
  );
}
