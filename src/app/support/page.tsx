import type { Metadata } from "next";
import { Activity, Mail } from "lucide-react";
import { FAQ, LINKS } from "@/content/site";
import { GlassCard } from "@/components/glass/GlassCard";

export const metadata: Metadata = {
  title: "支援與常見問題",
  description: "北科盒子使用問題排解、常見問題與聯絡方式。",
  alternates: { canonical: "/support/" },
};

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

const CONTACTS = [
  {
    icon: InstagramIcon,
    title: "Instagram 私訊",
    body: "@ntutbox_official，回報問題與功能許願的主要管道。",
    href: LINKS.instagram,
    label: "前往 Instagram",
    external: true,
  },
  {
    icon: Mail,
    title: "Email",
    body: "不方便用 IG 的話，寄信給開發者也可以。",
    href: `mailto:${LINKS.email}`,
    label: "poter.pan@panspace.me",
    external: false,
  },
  {
    icon: Activity,
    title: "服務狀態頁",
    body: "課表抓不到？先看看是不是學校系統掛了。",
    href: LINKS.status,
    label: "status.ntutbox.com",
    external: true,
  },
] as const;

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">支援與常見問題</h1>
      <p className="mt-3 leading-7 text-[var(--ink-soft)]">
        遇到問題先看看下面的常見問題；找不到答案的話，透過最下方的管道聯絡我們。
      </p>

      <h2 className="mt-12 text-xl font-semibold text-[var(--ink)]">常見問題</h2>
      <div className="mt-5 space-y-4">
        {FAQ.map((item) => (
          <GlassCard key={item.q} className="rounded-2xl p-5">
            <h3 className="text-[15px] font-semibold text-[var(--ink)]">{item.q}</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{item.a}</p>
          </GlassCard>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold text-[var(--ink)]">聯絡我們</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {CONTACTS.map((c) => (
          <GlassCard key={c.title} className="rounded-2xl p-0">
            <a
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              className="group block p-5"
            >
              <c.icon className="size-5 text-[var(--accent-ink)]" aria-hidden />
              <h3 className="mt-3 text-[15px] font-semibold text-[var(--ink)]">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-[var(--ink-soft)]">{c.body}</p>
              <p className="mt-3 break-all text-[13px] font-medium text-[var(--accent-ink)]">
                {c.label}
              </p>
            </a>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
