import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { APP_NAME, APP_STORE_CAMPAIGN_URL, LINKS } from "@/content/site";
import { cn } from "@/lib/utils";

/* 更多服務在窄螢幕收起，把空間讓給排課系統推廣入口 */
const NAV = [
  { href: "/#features", label: "功能", mobileHidden: false },
  { href: "/#services", label: "更多服務", mobileHidden: true },
  { href: "/support/", label: "支援", mobileHidden: false },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
      <div className="glass-surface mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full pl-3 pr-2">
        <Link href="/" className="flex items-center gap-2.5" aria-label={APP_NAME}>
          <Image src="/app-icon.png" alt="" width={32} height={32} className="rounded-lg" />
          {/* 窄螢幕收起字標（hero 緊接著就是 App 名稱），空間讓給排課系統入口 */}
          <span className="hidden text-[15px] font-semibold text-[var(--ink)] sm:block">
            {APP_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent-ink)]",
                item.mobileHidden && "hidden sm:block",
              )}
            >
              {item.label}
            </Link>
          ))}
          {/* 附屬服務推廣入口：soft-accent 突顯，但不搶「下載」主 CTA */}
          <a
            href={LINKS.courseSystem}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-0.5 inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent)]/20"
          >
            排課系統
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
          <a
            href={APP_STORE_CAMPAIGN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 hidden rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white sm:block"
          >
            下載
          </a>
        </nav>
      </div>
    </header>
  );
}
