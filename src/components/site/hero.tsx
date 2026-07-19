import Image from "next/image";
import type { ReactNode } from "react";
import { APP_NAME, APP_RATING, APP_TAGLINE, PLATFORM_NOTE } from "@/content/site";
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
        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <AppStoreButton />
            <a
              href="#guest"
              className="rounded-xl px-3 py-3 text-[15px] font-medium text-[var(--accent-ink)] transition-colors hover:bg-[var(--accent)]/10"
            >
              沒有帳號？先逛逛 →
            </a>
          </div>
          {/* 桌面訪客的下載通道：QR 白卡刻意用固定色（非 token）——
              掃描對比需要恆白底，明暗主題下外觀一致。
              hover 放大方便掃描（SVG 向量，放大不失真） */}
          <div className="relative hidden flex-col items-center gap-1.5 rounded-2xl bg-white p-2.5 shadow-lg shadow-[rgba(30,41,70,0.15)] transition-transform duration-200 ease-out hover:z-10 hover:scale-[1.75] hover:shadow-xl hover:shadow-[rgba(30,41,70,0.25)] lg:flex">
            <div className="relative">
              <img
                src="/qr-appstore.svg"
                alt="掃描 QR code 下載北科盒子"
                width={92}
                height={92}
              />
              <Image
                src="/app-icon.png"
                alt=""
                aria-hidden
                width={24}
                height={24}
                className="absolute inset-0 m-auto size-6 rounded-md"
              />
            </div>
            <p className="text-[11px] font-medium text-slate-500">手機掃描下載</p>
          </div>
        </div>
        <p className="mt-5 text-[13px] text-[var(--ink-faint)]">
          <span className="font-medium text-[var(--ink-soft)]">
            App Store {APP_RATING.value} ★
          </span>
          ・{PLATFORM_NOTE}
        </p>
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
