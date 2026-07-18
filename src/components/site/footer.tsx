import Link from "next/link";
import { DISCLAIMER, LINKS } from "@/content/site";

const FOOTER_LINKS = [
  { href: "/privacy/", label: "隱私權政策", external: false },
  { href: "/support/", label: "支援與常見問題", external: false },
  { href: LINKS.status, label: "服務狀態", external: true },
  { href: LINKS.instagram, label: "Instagram", external: true },
  { href: LINKS.courseGithub, label: "GitHub", external: true },
  { href: LINKS.templateApi, label: "課表範本 API", external: true },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-6 pb-10 pt-20">
      <div className="glass-soft rounded-2xl px-6 py-8 text-sm sm:px-8">
        <p className="leading-6 text-[var(--ink-soft)]">{DISCLAIMER}</p>
        <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
          {FOOTER_LINKS.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.href}
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
        <p className="mt-6 text-[13px] text-[var(--ink-faint)]">© 2026 PoterPan</p>
      </div>
    </footer>
  );
}
