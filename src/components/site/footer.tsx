import Link from "next/link";
import { DISCLAIMER, LINKS, SOCIALS } from "@/content/site";

const NAV_LINKS = [
  { href: "/privacy/", label: "隱私權政策", external: false },
  { href: "/support/", label: "支援與常見問題", external: false },
  { href: LINKS.status, label: "服務狀態", external: true },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-6 pb-10 pt-20">
      <div className="glass-soft rounded-2xl px-6 py-8 text-sm sm:px-8">
        <p className="leading-6 text-[var(--ink-soft)]">{DISCLAIMER}</p>
        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
          {NAV_LINKS.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ink-soft)] transition-colors hover:text-[var(--accent-ink)]"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className="text-[var(--ink-soft)] transition-colors hover:text-[var(--accent-ink)]"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
          {SOCIALS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${s.platform}：${s.text}`}
              className="group inline-flex items-center gap-2"
            >
              <s.icon className="size-4 text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent-ink)]" aria-hidden />
              <span className="text-[13px] text-[var(--ink-soft)] transition-colors group-hover:text-[var(--accent-ink)]">
                {s.text}
              </span>
            </a>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-[var(--ink-faint)]">© 2026 PoterPan</p>
      </div>
    </footer>
  );
}
