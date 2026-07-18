import Image from "next/image";
import Link from "next/link";
import { APP_NAME, APP_STORE_URL } from "@/content/site";

const NAV = [
  { href: "/#features", label: "功能" },
  { href: "/#services", label: "更多服務" },
  { href: "/support/", label: "支援" },
];

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
      <div className="glass-surface mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full pl-3 pr-2">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/app-icon.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-[15px] font-semibold text-[var(--ink)]">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--accent)]/10 hover:text-[var(--accent-ink)]"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={APP_STORE_URL}
            className="ml-1 hidden rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white sm:block"
          >
            下載
          </a>
        </nav>
      </div>
    </header>
  );
}
