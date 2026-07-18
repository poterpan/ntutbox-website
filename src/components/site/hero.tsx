import Image from "next/image";
import type { ReactNode } from "react";
import { APP_NAME, APP_TAGLINE, PLATFORM_NOTE } from "@/content/site";
import { AppStoreButton } from "@/components/site/app-store-button";

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[260px] sm:w-[300px]">
      <div className="glass-surface rounded-[44px] p-2.5">
        <div className="overflow-hidden rounded-[34px]">{children}</div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto grid max-w-5xl items-center gap-12 px-6 pb-20 pt-32 sm:pt-40 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[13px] font-medium text-[var(--accent-ink)]">
          北科學生獨立開發・非官方 App
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
          {APP_NAME}
        </h1>
        <p className="mt-3 text-xl text-[var(--ink)] sm:text-2xl">{APP_TAGLINE}</p>
        <p className="mt-4 max-w-md text-base leading-7 text-[var(--ink-soft)]">
          課表、成績、選課、公告——常用的校務功能整合成一個
          App，資料直接來自學校系統，登入一次就緒。
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <AppStoreButton />
          <a
            href="#guest"
            className="rounded-xl px-5 py-3 text-[15px] font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent)]/10"
          >
            沒有帳號？先逛逛 →
          </a>
        </div>
        <p className="mt-5 text-[13px] text-[var(--ink-faint)]">{PLATFORM_NOTE}</p>
      </div>
      <PhoneFrame>
        <Image
          src="/screenshots/preview-1.webp"
          alt="北科盒子今日總覽畫面，顯示目前課程與待辦事項"
          width={600}
          height={1300}
          priority
          className="h-auto w-full"
        />
      </PhoneFrame>
    </section>
  );
}
