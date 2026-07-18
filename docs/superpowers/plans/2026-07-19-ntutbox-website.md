# 北科盒子官網 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建置 ntutbox.com 官網——單頁 Landing＋隱私權政策＋支援/FAQ＋404，靜態部署 Cloudflare Workers。

**Architecture:** Next.js 16 App Router 全靜態 export（`output: "export"`），設計 token 與 Liquid-Glass 元件照抄 ntutbox-course，內容集中在 `src/content/site.ts` 單一資料層，頁面元件純展示。驗收由 `scripts/check-site.mjs` 對 `out/` 輸出做內容斷言（文案鐵則、必要檔案、SEO），每個任務「先加斷言（紅）→ 實作（綠）→ commit」。

**Tech Stack:** Next.js 16.2.9、React 19.2.4、Tailwind 4（純 CSS `@theme`，無 config 檔）、TypeScript、lucide-react、pnpm、Cloudflare Workers static assets（wrangler）。

**Spec:** `docs/superpowers/specs/2026-07-19-ntutbox-website-design.md`（本計畫的唯一需求依據）

## Global Constraints

- **套件管理**：pnpm。版本鎖定照 ntutbox-course：`next 16.2.9`、`react 19.2.4`、`react-dom 19.2.4`、`tailwindcss ^4`、`@tailwindcss/postcss ^4`、`wrangler ^4.100.0`、`lucide-react ^1.17.0`、`clsx ^2.1.1`、`tailwind-merge ^3.6.0`、`typescript ^5`。
- **Next 16 警語**（來自 ntutbox-course AGENTS.md）：Next 16 與訓練資料認知可能不同，行為存疑時讀 `node_modules/next/dist/docs/` 而非憑印象。
- **靜態 export 三件套**：`output: "export"`＋`images: { unoptimized: true }`＋`trailingSlash: true`。站內連結一律含尾斜線（`/privacy/`、`/support/`）。
- **Token 唯一來源**：文字色一律 `text-[var(--ink)]` / `--ink-soft` / `--ink-faint` 三階；強調色一律 `--accent`（實心底）/ `--accent-ink`（文字）。**禁止** raw Tailwind 色（`blue-500`、`zinc-400`…）當文字/強調色（不吃 dark mode）。
- **圓角級距**（ntutbox-course `apps/web/AGENTS.md:32-39`）：badge → `rounded-md`；小按鈕 → `rounded-lg`；卡片/大 CTA → `rounded-xl`～`rounded-2xl`；大面板 → `rounded-2xl`～`rounded-3xl`；chip/藥丸 → `rounded-full`。同心規則：內圓角 ≈ 外圓角 − padding。
- **文案鐵則**（spec §3，check-site.mjs 會硬性檢查）：全站禁出現 `visionOS`、`微學程`、`Mac 版/Mac版/macOS 版/macOS版`、`ntutbox://`；提到 Live Activity／動態島的頁面必須同頁出現「開發中」；免責聲明全文必須在 footer；平台句固定為「為 iPhone 設計，iPad 與 Apple Silicon Mac 亦可安裝使用」。
- **全站繁體中文**，`<html lang="zh-Hant-TW">`。
- **個資**：只使用 App Store 公開截圖，不自製含真實資料的示意圖。
- 每個任務結尾 commit；commit message 用 conventional prefix（`feat:`/`chore:`/`docs:`）＋繁中描述。

---

### Task 1: 專案骨架與設計 token 移植

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/lib/utils.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string`（`@/lib/utils`）；globals.css 提供 class `.glass-surface`、`.glass-soft`、`.thin-scroll` 與 CSS 變數 `--ink/--ink-soft/--ink-faint/--accent/--accent-ink/--glass-*`，供後續所有元件使用。

- [ ] **Step 1: 寫 package.json**

```json
{
  "name": "ntutbox-website",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "typecheck": "tsc --noEmit",
    "check": "node scripts/check-site.mjs",
    "fetch-assets": "node scripts/fetch-assets.mjs",
    "preview": "wrangler dev",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.17.0",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "tailwind-merge": "^3.6.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20.19.43",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5",
    "wrangler": "^4.100.0"
  }
}
```

- [ ] **Step 2: 寫 tsconfig.json**

> 實測註記（2026-07-19）：Next 16.2.9 build 會強制把 `"jsx"` 改寫為 `"react-jsx"` 並在
> include 加入 `.next/dev/types/**/*.ts`（已實驗證實）。以 Next 改寫後的版本為準。

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 寫 next.config.ts 與 postcss.config.mjs**

`next.config.ts`：

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

`postcss.config.mjs`：

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

- [ ] **Step 4: 寫 src/app/globals.css（token 照抄 ntutbox-course，dark 改用 prefers-color-scheme）**

來源是 `/Users/poterpan/Documents/Coding/NTUT/ntutbox-course/apps/web/src/app/globals.css`；差異：(1) 不引 shadcn/tw-animate-css（官網不用 shadcn）；(2) 課程 repo 用 `.dark` class，官網無主題切換器，一律改 `@media (prefers-color-scheme: dark)`；(3) 不抄 dangling 的 `--font-geist-mono`。完整檔案：

```css
@import "tailwindcss";

/* ===== Liquid-Glass tokens（照抄 ntutbox-course apps/web/src/app/globals.css） ===== */
:root {
  --glass-blur: 26px;
  --glass-bg: rgba(255, 255, 255, 0.78);
  --glass-bg-soft: rgba(255, 255, 255, 0.6);
  --glass-bg-strong: rgba(255, 255, 255, 0.9);
  --glass-border: rgba(255, 255, 255, 0.8);
  --glass-radius: 22px;
  --glass-shadow: 0 10px 36px -8px rgba(30, 41, 70, 0.26);
  --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  --ink: #141a24;          /* primary text — near-black */
  --ink-soft: #4a5365;     /* secondary text — readable slate */
  --ink-faint: #7b8597;    /* tertiary only (timestamps) */
  --accent: #3b82f6;       /* button / fill */
  --accent-ink: #1d4ed8;   /* accent-coloured TEXT on light (higher contrast) */
  --font-system: -apple-system, BlinkMacSystemFont, "SF Pro TC", "PingFang TC",
    "Microsoft JhengHei", "Segoe UI", Roboto, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --glass-bg: rgba(26, 30, 38, 0.74);
    --glass-bg-soft: rgba(26, 30, 38, 0.55);
    --glass-bg-strong: rgba(26, 30, 38, 0.9);
    --glass-border: rgba(255, 255, 255, 0.14);
    --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    --ink: #f1f4fa;
    --ink-soft: #aeb8c9;
    --ink-faint: #7e899b;
    --accent: #3b82f6;
    --accent-ink: #93b4fb;
  }
}

html {
  font-family: var(--font-system);
  scroll-behavior: smooth;
}

/* Ambient Apple-style mesh so glass has depth to refract */
body {
  min-height: 100dvh;
  color: var(--ink);
  background:
    radial-gradient(1100px 760px at 8% -12%, rgba(108, 162, 255, 0.34), transparent 58%),
    radial-gradient(980px 720px at 112% 4%, rgba(176, 140, 255, 0.26), transparent 55%),
    radial-gradient(880px 900px at 52% 118%, rgba(96, 214, 198, 0.26), transparent 60%),
    linear-gradient(180deg, #eef2fb 0%, #e6ebf6 48%, #e9eaf3 100%);
  background-attachment: fixed;
}

@media (prefers-color-scheme: dark) {
  body {
    background:
      radial-gradient(1100px 760px at 8% -12%, rgba(58, 96, 180, 0.4), transparent 58%),
      radial-gradient(980px 720px at 112% 4%, rgba(108, 80, 180, 0.32), transparent 55%),
      radial-gradient(880px 900px at 52% 118%, rgba(40, 120, 110, 0.3), transparent 60%),
      linear-gradient(180deg, #0f131c 0%, #121723 100%);
  }
}

.glass-surface {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-highlight);
}
.glass-soft {
  background: var(--glass-bg-soft);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* thin scrollbars inside glass panels */
.thin-scroll { scrollbar-width: thin; scrollbar-color: rgba(120,130,150,0.4) transparent; }
.thin-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.thin-scroll::-webkit-scrollbar-thumb { background: rgba(120,130,150,0.35); border-radius: 999px; }

/* Accessibility fallbacks: opaque + no blur/motion */
@media (prefers-reduced-transparency: reduce) {
  .glass-surface, .glass-soft { background: var(--glass-bg-strong); backdrop-filter: none; -webkit-backdrop-filter: none; }
}
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  html { scroll-behavior: auto; }
}
```

- [ ] **Step 5: 寫 src/lib/utils.ts**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: 寫最小 layout 與首頁（之後任務會擴充）**

`src/app/layout.tsx`：

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "北科盒子",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`：

```tsx
export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <h1 className="text-3xl font-bold text-[var(--ink)]">北科盒子</h1>
    </main>
  );
}
```

- [ ] **Step 7: 安裝依賴並驗證 build**

Run: `pnpm install && pnpm build && ls out/index.html`
Expected: build 成功結束（`✓ Exporting` 或同義輸出）、`out/index.html` 存在。若 lucide-react `^1.17.0` 解析失敗，改跑 `pnpm add lucide-react@latest` 再 build。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Next.js 16 靜態骨架 + Liquid-Glass 設計 token（照抄 ntutbox-course）"
```

---

### Task 2: 素材抓取（App icon、9 張截圖、OG 圖）

**Files:**
- Create: `scripts/fetch-assets.mjs`
- Create（腳本產出並 commit）: `public/app-icon.png`, `public/og.png`, `public/screenshots/preview-{1..8,11}.webp`

**Interfaces:**
- Produces: 靜態資產路徑 `/app-icon.png`、`/og.png`、`/screenshots/preview-N.webp`（N ∈ 1..8, 11），後續元件以這些路徑引用。

- [ ] **Step 1: 寫 scripts/fetch-assets.mjs**

URL 是 2026-07-19 從 App Store 頁面與 iTunes lookup API 實測取得的：

```js
#!/usr/bin/env node
// 從 App Store 抓官網素材（皆為已公開的行銷素材）。產出 commit 進 repo，
// 平常不需重跑；App Store 改版換截圖時重跑一次即可。
import { mkdir, writeFile } from "node:fs/promises";

const SHOTS = [
  ["preview-1", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/ff/c8/a5/ffc8a5e3-b979-c213-b806-9627d2bb75b4/Preview-1.jpg"],
  ["preview-2", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/23/16/88/231688b3-89f4-4fc7-4ad2-a98861200002/Preview-2.jpg"],
  ["preview-3", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/f5/d2/0c/f5d20cf4-ad53-41fb-ae70-4ddf73fceae3/Preview-3.jpg"],
  ["preview-4", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/95/0f/0e/950f0e3b-bce0-fc55-f87e-13c7d3fb71ee/Preview-4.jpg"],
  ["preview-5", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/b5/51/d4/b551d4a9-1a67-b6d3-22a5-5c09ee195983/Preview-5.jpg"],
  ["preview-6", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/53/de/0c/53de0c0c-de5a-9ce4-1b53-16a3838c53d6/Preview-6.jpg"],
  ["preview-7", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/75/ea/83/75ea8348-85e7-7bfe-2b4f-6b52ffd7aa4b/Preview-7.jpg"],
  ["preview-8", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/a8/8c/00/a88c00f9-c769-6289-f200-68e4d3f1b35c/Preview-8.jpg"],
  ["preview-11", "https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/6e/2e/ab/6e2eab87-1362-f0f5-1b84-b76fef2a451f/Preview-11.jpg"],
];
const ICON =
  "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c5/62/65/c562654f-eb43-f780-0692-f015ec00367e/AppIcon-0-0-1x_U007epad-0-1-sRGB-85-220.png/1024x1024bb.png";
const OG = "https://assets.ntutbox.com/og-share.png";

async function grab(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log("✓", dest);
}

await mkdir("public/screenshots", { recursive: true });
await grab(ICON, "public/app-icon.png");
await grab(OG, "public/og.png");
for (const [name, base] of SHOTS) {
  await grab(`${base}/600x1300bb.webp`, `public/screenshots/${name}.webp`);
}
console.log("done");
```

- [ ] **Step 2: 執行並驗證**

Run: `pnpm fetch-assets && ls -la public/app-icon.png public/og.png public/screenshots/`
Expected: 11 個檔案全部產出、每個都 > 10KB。用 Read 工具實際打開 `public/app-icon.png` 看一眼，確認是北科盒子 icon 不是破圖。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: 抓取 App Store 素材（icon、9 張截圖、OG 圖）"
```

---

### Task 3: 內容資料層與驗收腳本骨架

**Files:**
- Create: `src/content/site.ts`
- Create: `scripts/check-site.mjs`

**Interfaces:**
- Produces（`@/content/site` 的具名 export，後續所有元件與頁面 import 這裡，**不得**在元件裡寫死文案）：
  - `SITE_URL`, `APP_NAME`, `APP_NAME_EN`, `APP_TAGLINE`, `APP_STORE_URL`, `SITE_TITLE`, `SITE_DESCRIPTION`, `DISCLAIMER`, `PLATFORM_NOTE`: `string`
  - `LINKS: { courseSystem, status, instagram, email, courseGithub, websiteGithub, templateApi }`（皆 string）
  - `MAIN_FEATURES: Feature[]`，`Feature = { icon: LucideIcon; title: string; description: string }`
  - `MORE_FEATURES: MinorFeature[]`，`MinorFeature = { title: string; description: string; badge?: string }`
  - `COMING_SOON: string[]`、`SCREENSHOTS: { src: string; alt: string }[]`、`FAQ: { q: string; a: string }[]`
  - `ECOSYSTEM: { title: string; href: string; display: string; description: string; stats: string }[]`

- [ ] **Step 1: 寫 src/content/site.ts（全站文案唯一來源）**

```ts
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  Clock,
  Compass,
  LayoutGrid,
  ListOrdered,
  TrendingUp,
} from "lucide-react";

export const SITE_URL = "https://ntutbox.com";
export const APP_NAME = "北科盒子";
export const APP_NAME_EN = "NTUT Box";
export const APP_TAGLINE = "提供北科學生方便的校務體驗";
export const APP_STORE_URL = "https://apps.apple.com/tw/app/id6753217696";

export const SITE_TITLE = "北科盒子 NTUT Box — 北科大學生的智慧課表 App";
export const SITE_DESCRIPTION =
  "課表同步、成績查詢、期末預選選課、i 學園整合、60+ 項校務服務一鍵直達。由北科學生獨立開發的非官方校務 App，iPhone 免費下載。";

export const DISCLAIMER =
  "本 App 為非官方應用程式，與國立臺北科技大學無正式關聯。所有課表資料來源於 NTUT 官方教務系統。";

export const PLATFORM_NOTE =
  "免費下載・iOS 18.2 以上・為 iPhone 設計，iPad 與 Apple Silicon Mac 亦可安裝使用";

export const LINKS = {
  courseSystem: "https://course.ntutbox.com",
  status: "https://status.ntutbox.com",
  instagram: "https://www.instagram.com/ntutbox_official",
  email: "poter.pan@panspace.me",
  courseGithub: "https://github.com/poterpan/ntutbox-course",
  websiteGithub: "https://github.com/poterpan/ntutbox-website",
  templateApi: "https://github.com/poterpan/ntutbox-template-api",
};

export type Feature = { icon: LucideIcon; title: string; description: string };

export const MAIN_FEATURES: Feature[] = [
  {
    icon: Calendar,
    title: "課表同步",
    description:
      "登入即自動抓取本學期課表，週視圖清楚呈現、連堂自動合併，不用自己抄課表。",
  },
  {
    icon: Clock,
    title: "今日總覽",
    description: "現在上什麼課、下一堂在哪、還有多久下課，打開 App 一眼掌握。",
  },
  {
    icon: LayoutGrid,
    title: "桌面小工具",
    description: "主畫面與鎖定畫面直接顯示當前與下一堂課，不必開 App 就能看。",
  },
  {
    icon: TrendingUp,
    title: "成績查詢",
    description:
      "各科成績、歷年 GPA 圖表、班級／分組／系所排名與 Top 百分比，一次看清楚。",
  },
  {
    icon: ListOrdered,
    title: "期末預選選課",
    description:
      "App 內加選本班與外班課程，多選加拖曳排志願，送出後逐門回報選上與否。",
  },
  {
    icon: BookOpen,
    title: "i 學園整合",
    description: "公告、作業、教材、修課名單一站看齊，課程錄影也能直接串流播放。",
  },
  {
    icon: Compass,
    title: "校園服務入口",
    description: "7 大類 60+ 項校務服務一鍵直達，多數支援 SSO 免再登入。",
  },
  {
    icon: CalendarCheck,
    title: "校園行事曆",
    description:
      "自動同步學校行事曆並可匯出到 Apple 日曆，期中考、選課、放假不再錯過。",
  },
];

export type MinorFeature = { title: string; description: string; badge?: string };

export const MORE_FEATURES: MinorFeature[] = [
  {
    title: "Live Activity 動態島",
    description: "上課前自動顯示課程資訊，整堂課倒數與進度即時更新。",
    badge: "開發中",
  },
  { title: "課前通知", description: "每週自動排程提醒，沒開 App 也準時通知上課。" },
  { title: "北科小郵差", description: "校園公告依 6 種分類篩選，支援詳情與附件下載。" },
  {
    title: "教學評量快速填寫",
    description: "自動帶入預設答案，開放期間主動提醒，不再錯過。",
  },
  { title: "傑出教學獎票選", description: "在 App 內完成投票，直接解鎖成績查詢。" },
  { title: "選課確認", description: "「確認選課結果」等一次性手續，App 內完成。" },
  { title: "失物招領", description: "瀏覽學務處遺失物公告，支援搜尋與學期切換。" },
  { title: "個人作業清單", description: "手動新增待辦作業，獨立於 i 學園之外管理。" },
  { title: "課表匯入與範本", description: "從外部範本或手動建立課表，含匯入預覽。" },
  { title: "課表分享", description: "一條連結把課表分享給同學，或匯入他人課表。" },
];

export const COMING_SOON = ["多學期課表查詢", "iCal 匯出"];

export type Screenshot = { src: string; alt: string };

export const SCREENSHOTS: Screenshot[] = [
  { src: "/screenshots/preview-1.webp", alt: "北科盒子 App 截圖 1" },
  { src: "/screenshots/preview-2.webp", alt: "北科盒子 App 截圖 2" },
  { src: "/screenshots/preview-3.webp", alt: "北科盒子 App 截圖 3" },
  { src: "/screenshots/preview-4.webp", alt: "北科盒子 App 截圖 4" },
  { src: "/screenshots/preview-5.webp", alt: "北科盒子 App 截圖 5" },
  { src: "/screenshots/preview-6.webp", alt: "北科盒子 App 截圖 6" },
  { src: "/screenshots/preview-7.webp", alt: "北科盒子 App 截圖 7" },
  { src: "/screenshots/preview-8.webp", alt: "北科盒子 App 截圖 8" },
  { src: "/screenshots/preview-11.webp", alt: "北科盒子 App 截圖 9" },
];

export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    q: "使用北科盒子需要什麼帳號？",
    a: "需要北科大校務系統帳號（學號與密碼）。還沒有帳號的話，可以用「訪客模式」免登入體驗完整介面與操作。",
  },
  {
    q: "我的帳號密碼安全嗎？",
    a: "密碼使用 iOS Keychain 安全儲存於你的裝置本地，不會上傳到任何第三方伺服器，僅在需要時與北科大官方系統進行認證。",
  },
  {
    q: "課表或成績突然抓不到資料怎麼辦？",
    a: "多半是學校系統維護或改版造成。可以先到服務狀態頁查看各校務系統的即時狀態；若學校系統顯示正常但 App 仍無法使用，請透過下方管道聯絡我們。",
  },
  {
    q: "支援哪些裝置？",
    a: "北科盒子為 iPhone 設計（需 iOS 18.2 以上），iPad 與 Apple Silicon Mac 亦可安裝使用。",
  },
  {
    q: "北科盒子是學校官方 App 嗎？",
    a: "不是。北科盒子由北科學生獨立開發，與國立臺北科技大學無正式關聯；所有校務資料都來自學校官方系統。",
  },
  {
    q: "如何回報問題或提出建議？",
    a: "歡迎透過 Instagram @ntutbox_official 私訊，或寄信到 poter.pan@panspace.me。",
  },
];

export const ECOSYSTEM = [
  {
    title: "北科盒子 排課系統",
    href: LINKS.courseSystem,
    display: "course.ntutbox.com",
    description:
      "免登入的網頁版排課規劃器：全文查課、多維篩選、衝堂偵測、學分統計、教學大綱。",
    stats: "收錄 11 個學期、32,000+ 筆開課資料，每日自動更新",
  },
  {
    title: "服務狀態頁",
    href: LINKS.status,
    display: "status.ntutbox.com",
    description:
      "即時監控北科 Portal、選課系統、i 學園等校務系統連線狀態，系統掛了先來這裡看。",
    stats: "監控 6 個校務系統",
  },
];
```

- [ ] **Step 2: 寫 scripts/check-site.mjs（驗收骨架，後續任務往裡加斷言）**

```js
#!/usr/bin/env node
// 官網靜態輸出驗收：對 out/ 做內容斷言（文案鐵則 + 必要檔案 + SEO）。
// 用法：pnpm build && pnpm check
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const failures = [];
const fail = (msg) => failures.push(msg);

const exists = (p) => existsSync(join(OUT, p));
const read = (p) => readFileSync(join(OUT, p), "utf8");

function allHtmlFiles(dir = OUT, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) allHtmlFiles(p, acc);
    else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

// ── 1. 必要檔案（隨任務增長）────────────────────────────
const REQUIRED_FILES = ["index.html", "app-icon.png", "og.png"];
for (const f of REQUIRED_FILES) if (!exists(f)) fail(`缺少必要檔案 out/${f}`);

const shots = exists("screenshots")
  ? readdirSync(join(OUT, "screenshots")).filter((f) => f.endsWith(".webp"))
  : [];
if (shots.length !== 9) fail(`out/screenshots 應有 9 張 webp，實際 ${shots.length}`);

// ── 2+3. 全站禁字（spec §3 文案鐵則）與 Live Activity 規則 ──
const FORBIDDEN = ["visionOS", "微學程", "Mac 版", "Mac版", "macOS 版", "macOS版", "ntutbox://"];
for (const file of allHtmlFiles()) {
  const html = readFileSync(file, "utf8");
  for (const term of FORBIDDEN) {
    if (html.includes(term)) fail(`${file} 含禁字「${term}」`);
  }
  if (/Live Activity|動態島/.test(html) && !html.includes("開發中")) {
    fail(`${file} 提到 Live Activity／動態島但未標「開發中」`);
  }
}

// ── 4. 各頁內容斷言（隨任務增長；缺檔已在 §1 報告，這裡跳過）──
const PAGE_ASSERTIONS = {
  "index.html": [],
};
for (const [page, terms] of Object.entries(PAGE_ASSERTIONS)) {
  if (!exists(page)) continue;
  const html = read(page);
  for (const t of terms) {
    if (!html.includes(t)) fail(`out/${page} 缺少必要內容「${t}」`);
  }
}

if (failures.length) {
  console.error(`✗ check-site 失敗（${failures.length} 項）：`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}
console.log("✓ check-site 全部通過");
```

- [ ] **Step 3: 驗證（含 typecheck，確認 site.ts 型別正確）**

Run: `pnpm typecheck && pnpm build && pnpm check`
Expected: 三個命令全過，最後印出 `✓ check-site 全部通過`。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 全站文案資料層 site.ts + 驗收腳本 check-site.mjs"
```

---

### Task 4: 共用元件與版面骨架（Header / Footer / GlassCard / CTA 按鈕）

**Files:**
- Create: `src/components/glass/GlassCard.tsx`（照抄 ntutbox-course `apps/web/src/components/glass/GlassCard.tsx`）
- Create: `src/components/site/app-store-button.tsx`, `src/components/site/section-heading.tsx`, `src/components/site/header.tsx`, `src/components/site/footer.tsx`
- Modify: `src/app/layout.tsx`（掛 Header/Footer）
- Modify: `scripts/check-site.mjs`（加 footer 斷言）

**Interfaces:**
- Consumes: `cn`（Task 1）、`@/content/site` 常數（Task 3）
- Produces:
  - `<GlassCard className?>`：`div` wrapper，class `glass-surface rounded-xl p-3` 可被 className 覆寫
  - `<AppStoreButton className?>`：主 CTA，連到 `APP_STORE_URL`
  - `<SectionHeading eyebrow? title description?>`：置中的區塊標題
  - `<SiteHeader />`、`<SiteFooter />`：layout 專用

- [ ] **Step 1: 在 check-site.mjs 加 footer 斷言（先紅）**

把 `PAGE_ASSERTIONS` 的 `"index.html"` 改成：

```js
const PAGE_ASSERTIONS = {
  "index.html": [
    // Footer（Task 4）
    "本 App 為非官方應用程式，與國立臺北科技大學無正式關聯。所有課表資料來源於 NTUT 官方教務系統。",
    "© 2026 PoterPan",
    "/privacy/",
    "/support/",
    "status.ntutbox.com",
    "instagram.com/ntutbox_official",
  ],
};
```

Run: `pnpm build && pnpm check`
Expected: FAIL，列出 index.html 缺少上述內容。

- [ ] **Step 2: 寫 GlassCard（照抄 course repo）**

`src/components/glass/GlassCard.tsx`：

```tsx
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-surface rounded-xl p-3", className)} {...props} />;
}
```

- [ ] **Step 3: 寫 AppStoreButton 與 SectionHeading**

`src/components/site/app-store-button.tsx`：

```tsx
import { APP_STORE_URL } from "@/content/site";
import { cn } from "@/lib/utils";

export function AppStoreButton({ className }: { className?: string }) {
  return (
    <a
      href={APP_STORE_URL}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl bg-[var(--accent)] px-5 py-3",
        "text-[15px] font-medium text-white shadow-lg shadow-[var(--accent)]/25",
        "transition-transform hover:scale-[1.02] active:scale-[0.98]",
        className,
      )}
    >
      <svg viewBox="0 0 384 512" aria-hidden className="size-4 fill-current">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      在 App Store 下載
    </a>
  );
}
```

`src/components/site/section-heading.tsx`：

```tsx
export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="text-[13px] font-semibold tracking-wide text-[var(--accent-ink)]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)]">{title}</h2>
      {description && (
        <p className="mt-3 text-base leading-7 text-[var(--ink-soft)]">{description}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 寫 SiteHeader（懸浮玻璃膠囊導覽列）**

`src/components/site/header.tsx`：

```tsx
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
```

- [ ] **Step 5: 寫 SiteFooter（含免責聲明與全部對外連結）**

`src/components/site/footer.tsx`：

```tsx
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
```

- [ ] **Step 6: 在 layout 掛上 Header/Footer**

`src/app/layout.tsx` 的 return 改為：

```tsx
    <html lang="zh-Hant-TW">
      <body className="antialiased">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
```

並在檔頭加 import：

```tsx
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
```

- [ ] **Step 7: 驗證（綠）**

Run: `pnpm build && pnpm check`
Expected: PASS，`✓ check-site 全部通過`。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Header/Footer/GlassCard/CTA 共用元件與版面骨架"
```

---

### Task 5: Landing 全區塊（Hero、功能、截圖、訪客 CTA、生態系、JSON-LD）

**Files:**
- Create: `src/components/site/hero.tsx`, `src/components/site/features.tsx`, `src/components/site/screenshots.tsx`, `src/components/site/guest-cta.tsx`, `src/components/site/ecosystem.tsx`
- Modify: `src/app/page.tsx`（組裝＋JSON-LD）
- Modify: `scripts/check-site.mjs`（加 landing 斷言）

**Interfaces:**
- Consumes: Task 3 全部內容常數、Task 4 的 `GlassCard`/`AppStoreButton`/`SectionHeading`
- Produces: `<Hero />`, `<Features />`, `<Screenshots />`, `<GuestCta />`, `<Ecosystem />`（皆無 props）

- [ ] **Step 1: 加 landing 斷言（先紅）**

`PAGE_ASSERTIONS["index.html"]` 追加：

```js
    // Landing（Task 5）
    "apps.apple.com/tw/app/id6753217696",
    "提供北科學生方便的校務體驗",
    "iPad 與 Apple Silicon Mac 亦可安裝使用",
    "訪客模式",
    "course.ntutbox.com",
    "application/ld+json",
    "期末預選選課",
    "開發中",
```

Run: `pnpm build && pnpm check`
Expected: FAIL，列出缺少項。

- [ ] **Step 2: 寫 Hero（含 iPhone 外框 mockup）**

`src/components/site/hero.tsx`：

```tsx
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
          alt="北科盒子 App 主畫面"
          width={600}
          height={1300}
          priority
          className="h-auto w-full"
        />
      </PhoneFrame>
    </section>
  );
}
```

- [ ] **Step 3: 寫 Features（8 張主卡＋「還有更多」清單＋即將推出）**

`src/components/site/features.tsx`：

```tsx
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
```

- [ ] **Step 4: 寫 Screenshots（水平捲動截圖帶）**

`src/components/site/screenshots.tsx`：

```tsx
import Image from "next/image";
import { SCREENSHOTS } from "@/content/site";
import { SectionHeading } from "@/components/site/section-heading";

export function Screenshots() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading eyebrow="截圖" title="親眼看看" />
      </div>
      <div className="thin-scroll mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(1.5rem,calc((100vw-64rem)/2))] pb-4">
        {SCREENSHOTS.map((s) => (
          <div
            key={s.src}
            className="glass-soft w-[220px] shrink-0 snap-center overflow-hidden rounded-3xl p-2"
          >
            <Image
              src={s.src}
              alt={s.alt}
              width={600}
              height={1300}
              className="h-auto w-full rounded-2xl"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 寫 GuestCta 與 Ecosystem**

`src/components/site/guest-cta.tsx`：

```tsx
import { AppStoreButton } from "@/components/site/app-store-button";

export function GuestCta() {
  return (
    <section id="guest" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
      <div className="glass-surface rounded-3xl px-8 py-12 text-center sm:px-16">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
          還沒有北科帳號？
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--ink-soft)]">
          訪客模式讓你免登入完整體驗 App
          的介面與操作，資料只存在你的裝置上——適合下載前試用，或還沒拿到帳號的準新生。
        </p>
        <AppStoreButton className="mt-8" />
      </div>
    </section>
  );
}
```

`src/components/site/ecosystem.tsx`：

```tsx
import { ArrowUpRight } from "lucide-react";
import { ECOSYSTEM } from "@/content/site";
import { GlassCard } from "@/components/glass/GlassCard";
import { SectionHeading } from "@/components/site/section-heading";

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
            <a href={s.href} className="group block p-6">
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
            </a>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: 組裝 page.tsx＋JSON-LD**

`src/app/page.tsx` 整檔改為：

```tsx
import {
  APP_NAME,
  APP_NAME_EN,
  APP_STORE_URL,
  SITE_DESCRIPTION,
  SITE_URL,
} from "@/content/site";
import { Hero } from "@/components/site/hero";
import { Features } from "@/components/site/features";
import { Screenshots } from "@/components/site/screenshots";
import { GuestCta } from "@/components/site/guest-cta";
import { Ecosystem } from "@/components/site/ecosystem";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: APP_NAME,
  alternateName: APP_NAME_EN,
  description: SITE_DESCRIPTION,
  operatingSystem: "iOS",
  applicationCategory: "EducationApplication",
  offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "18" },
  url: SITE_URL,
  downloadUrl: APP_STORE_URL,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Features />
      <Screenshots />
      <GuestCta />
      <Ecosystem />
    </>
  );
}
```

- [ ] **Step 7: 補截圖 alt 文字**

用 Read 工具逐張打開 `public/screenshots/preview-*.webp` 看內容，把 `src/content/site.ts` 的 `SCREENSHOTS` alt 從「北科盒子 App 截圖 N」改成描述畫面的文字（例：「週課表視圖，連堂課程合併顯示」）。同時確認 Hero 用的 preview-1 alt 與實際畫面相符，不符就改 hero.tsx 的 alt。截圖內容不得描述成官網禁字相關功能。

- [ ] **Step 8: 驗證（綠）**

Run: `pnpm build && pnpm check`
Expected: PASS。另跑 `pnpm dev` 開 http://localhost:3000 目視一輪：Hero 手機框、8 卡片、截圖帶可橫捲、錨點 `/#features`、`/#services`、`#guest` 都能捲到對的區塊。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: Landing 全區塊（Hero/功能/截圖/訪客 CTA/生態系）+ JSON-LD"
```

---

### Task 6: 隱私權政策頁 `/privacy`

**Files:**
- Create: `src/app/privacy/page.tsx`
- Modify: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `LINKS`（Task 3）

- [ ] **Step 1: 加斷言（先紅）**

`REQUIRED_FILES` 追加 `"privacy/index.html"`；`PAGE_ASSERTIONS` 追加：

```js
  "privacy/index.html": [
    "隱私權政策",
    "Keychain",
    "第三方伺服器",
    "最後更新",
  ],
```

Run: `pnpm build && pnpm check` → Expected: FAIL（缺 privacy/index.html）。

- [ ] **Step 2: 寫 src/app/privacy/page.tsx（全文如下，這是對外承諾文字，不得自行增刪承諾範圍）**

```tsx
import type { Metadata } from "next";
import { LINKS } from "@/content/site";

export const metadata: Metadata = {
  title: "隱私權政策",
  description:
    "北科盒子（NTUT Box）隱私權政策：帳號密碼僅儲存於裝置本地，不上傳任何第三方伺服器。",
};

const UPDATED = "2026-07-19";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">隱私權政策</h1>
      <p className="mt-2 text-sm text-[var(--ink-faint)]">最後更新：{UPDATED}</p>
      <div className="mt-8 space-y-8 text-[15px] leading-7 text-[var(--ink-soft)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--ink)]">
        <section>
          <h2>適用範圍</h2>
          <p className="mt-2">
            本政策適用於「北科盒子（NTUT
            Box）」iOS 應用程式（下稱本 App）與本網站（ntutbox.com）。本 App
            為非官方應用程式，由北科大學生獨立開發，與國立臺北科技大學無正式關聯。
          </p>
        </section>
        <section>
          <h2>帳號與密碼</h2>
          <p className="mt-2">
            本 App 需以北科大校務系統帳號登入。你的帳號與密碼僅使用 iOS Keychain
            安全儲存於你的裝置本地，不會儲存或上傳到任何第三方伺服器；僅在需要時，用於與北科大官方系統進行認證。
          </p>
        </section>
        <section>
          <h2>校務資料</h2>
          <p className="mt-2">
            課表、成績、公告、行事曆等校務資料，由本 App
            以你的帳號直接向學校官方系統取得，儲存於你的裝置供功能顯示使用；除下述「課表分享」外，開發者的伺服器不會收集或保存這些資料。
          </p>
        </section>
        <section>
          <h2>課表分享</h2>
          <p className="mt-2">
            當你主動使用課表分享功能時，你選擇分享的課表內容（課程名稱與時段）會上傳以產生公開分享連結，任何取得連結的人都能檢視該課表，請自行斟酌分享對象。若需要移除已建立的分享連結，請透過下方管道聯絡我們。
          </p>
        </section>
        <section>
          <h2>訪客模式</h2>
          <p className="mt-2">訪客模式不需要任何帳號，所有示範資料僅存在於你的裝置本地。</p>
        </section>
        <section>
          <h2>本網站</h2>
          <p className="mt-2">
            本網站為純靜態頁面，不使用
            cookie，不埋設任何追蹤或分析程式，也不蒐集任何個人資料。網站由 Cloudflare
            代管，Cloudflare 可能基於安全與效能目的處理必要的連線紀錄。
          </p>
        </section>
        <section>
          <h2>政策變更</h2>
          <p className="mt-2">
            本政策若有重大變更，會直接更新本頁內容並調整「最後更新」日期。
          </p>
        </section>
        <section>
          <h2>聯絡我們</h2>
          <p className="mt-2">
            對本政策或個人資料處理有任何疑問，歡迎透過 Instagram{" "}
            <a
              href={LINKS.instagram}
              className="text-[var(--accent-ink)] underline underline-offset-4"
            >
              @ntutbox_official
            </a>{" "}
            或 email{" "}
            <a
              href={`mailto:${LINKS.email}`}
              className="text-[var(--accent-ink)] underline underline-offset-4"
            >
              {LINKS.email}
            </a>{" "}
            與我們聯絡。
          </p>
        </section>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: 驗證（綠）**

Run: `pnpm build && pnpm check` → Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 隱私權政策頁 /privacy"
```

---

### Task 7: 支援與常見問題頁 `/support`

**Files:**
- Create: `src/app/support/page.tsx`
- Modify: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `FAQ`, `LINKS`（Task 3）、`GlassCard`（Task 4）

- [ ] **Step 1: 加斷言（先紅）**

`REQUIRED_FILES` 追加 `"support/index.html"`；`PAGE_ASSERTIONS` 追加：

```js
  "support/index.html": [
    "常見問題",
    "instagram.com/ntutbox_official",
    "poter.pan@panspace.me",
    "status.ntutbox.com",
  ],
```

Run: `pnpm build && pnpm check` → Expected: FAIL（缺 support/index.html）。

- [ ] **Step 2: 寫 src/app/support/page.tsx**

```tsx
import type { Metadata } from "next";
import { Activity, Instagram, Mail } from "lucide-react";
import { FAQ, LINKS } from "@/content/site";
import { GlassCard } from "@/components/glass/GlassCard";

export const metadata: Metadata = {
  title: "支援與常見問題",
  description: "北科盒子使用問題排解、常見問題與聯絡方式。",
};

const CONTACTS = [
  {
    icon: Instagram,
    title: "Instagram 私訊",
    body: "@ntutbox_official，回報問題與功能許願的主要管道。",
    href: LINKS.instagram,
    label: "前往 Instagram",
  },
  {
    icon: Mail,
    title: "Email",
    body: "不方便用 IG 的話，寄信給開發者也可以。",
    href: `mailto:${LINKS.email}`,
    label: "poter.pan@panspace.me",
  },
  {
    icon: Activity,
    title: "服務狀態頁",
    body: "課表抓不到？先看看是不是學校系統掛了。",
    href: LINKS.status,
    label: "status.ntutbox.com",
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
            <a href={c.href} className="group block p-5">
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
```

- [ ] **Step 3: 驗證（綠）**

Run: `pnpm build && pnpm check` → Expected: PASS。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 支援與常見問題頁 /support"
```

---

### Task 8: 404 頁與 SEO 收尾（metadata / OG / sitemap / robots）

**Files:**
- Create: `src/app/not-found.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/layout.tsx`（完整 metadata＋viewport）
- Modify: `scripts/check-site.mjs`

**Interfaces:**
- Consumes: `SITE_URL`, `SITE_TITLE`, `SITE_DESCRIPTION`, `APP_NAME`（Task 3）

- [ ] **Step 1: 加斷言（先紅）**

`REQUIRED_FILES` 追加 `"404.html"`, `"sitemap.xml"`, `"robots.txt"`；`PAGE_ASSERTIONS` 追加：

```js
  "404.html": ["找不到", "回首頁"],
```

`PAGE_ASSERTIONS["index.html"]` 追加：

```js
    // SEO（Task 8）
    'property="og:image"',
    "北科盒子 NTUT Box — 北科大學生的智慧課表 App",
```

並在腳本 `PAGE_ASSERTIONS` 迴圈後面加 sitemap 斷言：

```js
if (exists("sitemap.xml")) {
  const sm = read("sitemap.xml");
  for (const u of [
    "https://ntutbox.com/",
    "https://ntutbox.com/privacy/",
    "https://ntutbox.com/support/",
  ]) {
    if (!sm.includes(`<loc>${u}</loc>`)) fail(`sitemap.xml 缺少 ${u}`);
  }
}
```

Run: `pnpm build && pnpm check` → Expected: FAIL（缺 404 內容、sitemap、robots、og:image）。

- [ ] **Step 2: 寫 not-found.tsx**

`src/app/not-found.tsx`：

```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-40 text-center">
      <p className="text-[13px] font-semibold tracking-wide text-[var(--accent-ink)]">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)]">
        找不到這個頁面
      </h1>
      <p className="mt-3 leading-7 text-[var(--ink-soft)]">
        這個網址不存在，或內容已經搬家了。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-medium text-white"
      >
        回首頁
      </Link>
    </section>
  );
}
```

- [ ] **Step 3: 寫 sitemap.ts 與 robots.ts**

`src/app/sitemap.ts`：

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "privacy/", "support/"].map((path) => ({
    url: `${SITE_URL}/${path}`,
    lastModified: new Date(),
  }));
}
```

`src/app/robots.ts`：

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: 完整化 layout metadata**

`src/app/layout.tsx` 的 import 與 metadata/viewport 整段改為：

```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  APP_NAME,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from "@/content/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s — ${APP_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: APP_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "zh_TW",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  icons: { icon: "/app-icon.png", apple: "/app-icon.png" },
};

export const viewport: Viewport = {
  // globals.css body 漸層的頂端底色（light）／dark 底色，與 ntutbox-course 一致
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f131c" },
  ],
};
```

- [ ] **Step 5: 驗證（綠）**

Run: `pnpm build && pnpm check`
Expected: PASS。另 `grep -o 'og:image' out/index.html` 有命中、`cat out/robots.txt` 含 sitemap 行。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 404 頁 + sitemap/robots + 完整 OG metadata"
```

---

### Task 9: Cloudflare 部署設定與 README

**Files:**
- Create: `wrangler.jsonc`, `README.md`

**Interfaces:**
- Produces: `pnpm preview`（本機 wrangler dev）與 `pnpm deploy`（之後 Phase 2 用）可用。

- [ ] **Step 1: 寫 wrangler.jsonc（assets-only Worker，無 server 邏輯）**

```jsonc
{
  // Cloudflare Workers — Static Assets only（無 Worker script）。
  // AASA 與 /share/* 由 ntutbox-edge 以精確 route 服務，本 Worker 不碰（spec §5）。
  // 部署：pnpm build && pnpm deploy；正式網域 ntutbox.com 於 Phase 2 在 Dashboard 綁定。
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "ntutbox-website",
  "compatibility_date": "2026-07-19",
  "assets": {
    "directory": "./out",
    "not_found_handling": "404-page"
  }
}
```

- [ ] **Step 2: 寫 README.md**

````markdown
# 北科盒子官網（ntutbox.com）

「北科盒子（NTUT Box）」的官方網站——北科大學生的智慧課表 App。
App Store：<https://apps.apple.com/tw/app/id6753217696>

## 開發

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # 靜態 export 到 out/
pnpm check          # 對 out/ 跑內容驗收（文案鐵則、SEO）
pnpm preview        # wrangler dev 本機模擬 Cloudflare 環境
```

## 技術

Next.js 16 靜態 export ＋ Tailwind 4，部署 Cloudflare Workers（static assets）。
設計 token 繼承 [ntutbox-course](https://github.com/poterpan/ntutbox-course) 的
Apple / Liquid-Glass 系統。文案素材與抓取腳本見 `scripts/`。

## License

MIT © 2026 PoterPan
````

- [ ] **Step 3: 驗證 wrangler 本機服務**

Run（背景啟動後 curl，最後結束程序）:

```bash
pnpm build && (pnpm exec wrangler dev --port 8787 &) && sleep 6 \
  && curl -s http://localhost:8787/ | grep -c "北科盒子" \
  && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/privacy/ \
  && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/no-such-page/ \
  ; pkill -f "wrangler dev" || true
```

Expected: 首頁 grep 計數 ≥ 1；`/privacy/` 回 `200`；`/no-such-page/` 回 `404`。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: Cloudflare Workers 部署設定（assets-only）+ README"
```

---

### Task 10: 總驗收（orchestrator 執行，非實作 subagent）

此任務由主對話（orchestrator）依 playbook 規則六執行，不派給實作者：

- [ ] **Step 1: 派 fresh-context 驗收 agent**——給它 spec 路徑 `docs/superpowers/specs/2026-07-19-ntutbox-website-design.md`，要求對 §3 文案鐵則與 §6 驗收條件**逐條回報 pass/fail**（read-back 實際檔案與 `out/` 輸出，不接受轉述）。不得把本計畫的結論餵給它。
- [ ] **Step 2: 派 `feature-dev:code-reviewer`** 審整個 diff（重點：token 規範、a11y、靜態 export 陷阱）。
- [ ] **Step 3: chrome-devtools 目視驗證**——`pnpm dev` 起本機站，用 chrome-devtools MCP 分別以 light/dark（emulate `prefers-color-scheme`）＋行動版寬度（390×844）與桌面（1440×900）截圖首頁、/privacy/、/support/、404，檢查無破版、玻璃效果與對比正常。
- [ ] **Step 4: 修正回歸**——任何 fail 修完後重跑 `pnpm build && pnpm check` 與該項驗收，全綠才算完成。
- [ ] **Step 5: Commit 收尾**（若有修正）。

---

## Phase 2: 上線與網域遷移（與使用者同步逐步執行，不得自動化跑完）

> 這一段是操作 checklist，不是 subagent 任務。每一步做完先驗證再做下一步；
> AASA 鐵則：`/.well-known/apple-app-site-association` 一斷，App 的 Universal Links
> 與密碼自動填入就壞。

1. **基準快照**：`curl -s https://ntutbox.com/.well-known/apple-app-site-association | tee /tmp/aasa-before.json | shasum`、`curl -sI "https://ntutbox.com/share/test"`，留存輸出。
2. **建 GitHub repo 並 push**（public，`poterpan/ntutbox-website`）——需使用者確認後：`gh repo create poterpan/ntutbox-website --public --source . --push`。
3. **Cloudflare 建 Worker**：Dashboard → Workers → 連 GitHub repo（Workers Builds），build command `pnpm build`，或先手動 `pnpm deploy`。驗證 `ntutbox-website.<account>.workers.dev` 正常。
4. **edge Worker 加精確 route**（Dashboard，ntutbox-edge）：新增 `ntutbox.com/.well-known/*` 與 `ntutbox.com/share/*` 兩條 route（保留原本 `ntutbox.com/*` 不動）。驗證 AASA 與 §1 快照 byte 相同（`curl ... | shasum` 比對）。
5. **切換根網域**：移除 edge 的 `ntutbox.com/*` route → 給 ntutbox-website Worker 綁 `ntutbox.com`（custom domain 或 route `ntutbox.com/*`）。
6. **復驗三件事**：AASA shasum 不變；`/share/test` 行為與快照一致；`https://ntutbox.com/` 回官網 200。任一 fail → 立即回滾（把 edge 的 `ntutbox.com/*` route 加回來）。
7. **綁狀態頁**：`status.ntutbox.com` → ntutbox-uptime.pages.dev（Pages custom domain）。驗證 200。
8. **隱私政策全文請使用者逐字過目**（對外承諾文字）。
9. **App Store Connect**（使用者本人操作，只提供清單）：Support URL `https://ntutbox.com/support/`、Marketing URL `https://ntutbox.com/`、Privacy Policy URL `https://ntutbox.com/privacy/`。
10. 上線後順手：以當日 iTunes lookup 值更新 JSON-LD 的 `ratingValue`/`ratingCount`（若有變動）。

---

## Self-Review 紀錄（計畫完成後自查）

- **Spec coverage**：spec §1 頁面架構（Task 5/6/7/8）、§2 視覺素材（Task 1/2）、§3 文案鐵則（check-site FORBIDDEN＋Live Activity 規則＋斷言）、§4 技術架構（Task 1/9）、§5 網域遷移（Phase 2）、§6 驗收（Task 10＋check-site）——全覆蓋。
- **Placeholder scan**：無 TBD/TODO；截圖 alt 有預設值＋明確的改寫步驟（Task 5 Step 7），非空缺。
- **Type consistency**：`cn`、`GlassCard`、`AppStoreButton`、`SectionHeading` 與 content export 名稱在各任務間一致（Interfaces 區塊逐一核對過）。
