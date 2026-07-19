# ntutbox-website — 北科盒子官網

「北科盒子（NTUT Box）」的官方行銷網站，線上網址 <https://ntutbox.com>。
Next.js 16 App Router **全靜態 export**（`output: "export"`）＋ Tailwind 4（純 CSS `@theme`，無 config 檔）
＋ TypeScript，部署於 Cloudflare Workers（static assets only，無 server 邏輯）。

## 分支與部署鐵則（CI：Cloudflare Workers Builds）

- **`main` = production**。push 到 main 會由 Cloudflare Workers Builds 自動建置部署到 ntutbox.com——
  **禁止直接 push main**，所有變更一律開 PR。
- PR 分支由 Workers Builds 產生 **version preview URL** 供預覽（`wrangler.jsonc` 已開 `preview_urls`）。
- Merge 前必須全綠：`pnpm typecheck && pnpm build && pnpm check`。
- 除非 CI 故障的緊急情況，不要手動 `pnpm deploy`。

## 常用命令

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # 靜態 export 到 out/
pnpm check          # 對 out/ 做內容驗收（文案鐵則、SEO 斷言）—— merge 前必跑
pnpm typecheck
pnpm preview        # wrangler dev，本機模擬 Cloudflare 環境
pnpm fetch-assets   # 重抓 App Store 素材（icon/截圖/OG），僅 App Store 改版時需要
```

## 驗收腳本 `scripts/check-site.mjs`

對 `out/` 靜態輸出做硬斷言：必要檔案、全站禁字、各頁必要內容、sitemap。
**新增頁面或改動關鍵文案時，同步增修斷言**（先加斷言看它紅、實作後轉綠）。
注意：React SSR 會在 JSX 插值間插入 `<!-- -->`，斷言字串不可跨越插值邊界。

## 文案鐵則（check-site 會擋，但寫文案時就要知道）

1. 全站禁字：`visionOS`、`微學程`、`Mac 版/Mac版/macOS 版/macOS版`、`ntutbox://`。
2. Live Activity／動態島必須同頁標「開發中」與「逐步完善」。
3. 平台句固定：「為 iPhone 設計，iPad 與 Apple Silicon Mac 亦可安裝使用」。
4. 非官方免責聲明（footer 全站）：「本 App 為非官方應用程式，與國立臺北科技大學無正式關聯。所有課表資料來源於 NTUT 官方教務系統。」
5. 截圖只用 App Store 公開行銷素材，任何素材不得含真實學號、姓名、班級。
6. 未上線功能不寫或標「規劃中／即將推出」，不過度承諾。

## 內容與設計規範

- **全站文案唯一來源：`src/content/site.ts`**。元件不寫死文案。
- 設計 token 繼承 [ntutbox-course](https://github.com/poterpan/ntutbox-course) 的 Apple / Liquid-Glass 系統
  （`src/app/globals.css`）：文字色一律 `--ink / --ink-soft / --ink-faint` 三階，強調色 `--accent` /
  `--accent-ink`，**禁止 raw Tailwind 色**（如 `blue-500`）當文字／強調色；玻璃面用 `.glass-surface` /
  `.glass-soft`。圓角級距：badge `rounded-md`、小按鈕 `rounded-lg`、卡片/大 CTA `rounded-xl~2xl`、
  大面板 `rounded-2xl~3xl`、chip/藥丸 `rounded-full`。
- 明暗主題由 `prefers-color-scheme` 驅動（無切換器），改樣式要兩邊都檢查。

## 隱私權政策 = 對外承諾

`src/app/privacy/page.tsx` 的內容是對外法律承諾，且已對齊 App Store 隱私標籤
（TelemetryDeck 匿名分析：產品互動／用於分析／未連結身分／App 內可關閉）。
**任何增刪都需 owner 逐字核可**，並確認與 App 實際行為（`NTUTBox/Services/AnalyticsService.swift`）一致。

## 架構邊界（不可逾越）

- **AASA（`/.well-known/apple-app-site-association`）與 `/share/*` 屬 ntutbox-edge Worker**
  （以精確 route 服務，優先權高於本站的 `ntutbox.com/*` route）。本 repo 絕不處理這兩類路徑——
  AASA 一斷，App 的 Universal Links 與密碼自動填入就壞。
- 根網域的 DNS 錨點是 ntutbox-edge 上的 `ntutbox.com` Custom Domain（歷史配置，勿移除），
  本站以 zone route 疊上接手其餘路徑（route 優先權實測高於 Custom Domain）。

## 已知雷區（實測記錄）

- Next 16 build 會**強制改寫 tsconfig.json**（`jsx: react-jsx`、include 加 `.next/dev/types/**`），別跟它對抗。
- lucide-react 1.x **已移除品牌 icon**；品牌 glyph 用 `src/components/site/social-icons.tsx`（simple-icons 路徑）。
- 本機 Chrome headless（含 `--headless=new`）**視窗寬下限 500px**，驗手機視口要用
  `pnpm dlx playwright screenshot --channel chrome --viewport-size="390,844"`。

## 相關專案

| Repo | 用途 |
|---|---|
| `/Users/poterpan/Documents/Coding/SwiftUI/NTUTBox` | iOS App 本體（private） |
| `/Users/poterpan/Documents/Coding/NTUT/ntutbox-course` | 排課系統（設計 token 來源） |
| `/Users/poterpan/Documents/Coding/NTUT/ntutbox-edge` | 根網域 edge Worker（AASA、/share） |
| `/Users/poterpan/Documents/Coding/NTUT/ntutbox-uptimeflare` | 服務狀態頁（status.ntutbox.com） |

設計文件：`docs/superpowers/specs/2026-07-19-ntutbox-website-design.md`（含歷次修訂註記）。
