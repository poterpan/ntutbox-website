# 北科盒子官網（ntutbox.com）設計文件

> 日期：2026-07-19。需求來源：`../../../../ntutbox-website-brief/BRIEF.md`（彙整層，
> 細節出處在同目錄 `sources/01-app.md`～`04-online.md`）。本文件記錄與使用者確認完畢的
> 全部決策與設計，是後續實作計畫的唯一依據；與 brief 衝突時以本文件為準。

## 0. 已確認決策（2026-07-19 與使用者逐項確認）

| 決策點 | 結論 |
|---|---|
| 網站範圍 | 完整官網：Landing ＋ 隱私權政策頁 ＋ 支援/FAQ 頁（一次補齊 App Store Connect 的 Support / Marketing / Privacy 三個 URL） |
| 網域 | 根網域 `ntutbox.com`（brief §6 方案 A） |
| edge Worker 共存 | **保留 ntutbox-edge，改精確 route**（`ntutbox.com/.well-known/*`、`ntutbox.com/share/*`），官網 Worker 接其餘 `ntutbox.com/*`。edge 程式碼不動 |
| 技術棧 | Next.js 16 靜態 export ＋ Tailwind 4 ＋ Cloudflare Workers static assets（照 ntutbox-course 慣例） |
| 語言 | 只有繁中（zh-TW），不做 i18n |
| 品牌色 | 沿用排課系統藍：accent `#3b82f6` 系 ＋ Liquid-Glass token（源：`ntutbox-course/apps/web/src/app/globals.css`） |
| 平台文案 | 「為 iPhone 設計，iPad 與 Apple Silicon Mac 亦可安裝使用」——使用者證實本人在 macOS 上實用（SSO 快速跳轉），但開發僅針對 iPhone 優化。不寫 visionOS |
| ntutbox-checkin | 不出現在官網 |
| 狀態頁 | 順手綁 `status.ntutbox.com` → 現有 ntutbox-uptime.pages.dev，官網連自有網域 |
| Repo | Public ＋ MIT（跟進 ntutbox-course、ntutbox-template-api 慣例） |
| 隱私權政策 | 自寫繁中版掛 `/privacy`，取代第三方 privacypolicies.com 頁面 |
| spec 審閱 | 使用者明確免除書面 spec 審閱關卡，設計口頭核可（2026-07-19） |

## 1. 頁面架構

| 路徑 | 內容 |
|---|---|
| `/` | 單頁式 Landing（分區見下） |
| `/privacy` | 隱私權政策（素材：brief §2.2 三段聲明＋App Store【安全與隱私】段） |
| `/support` | 支援/FAQ：常見問題、聯絡方式（IG `@ntutbox_official`、email `poter.pan@panspace.me`）、狀態頁連結 |
| 404 | 風格化 404，導回首頁 |

### Landing 分區（由上到下）

1. **Hero**：App icon、「北科盒子」、副標（底稿：「提供北科學生方便的校務體驗」）、
   App Store 下載按鈕（連 `https://apps.apple.com/tw/app/id6753217696`）、iPhone mockup 內嵌截圖。
2. **主打功能**（6–8 張卡片）：課表同步、今日總覽、Widget、成績查詢、期末預選選課、
   i學園整合、校園服務入口（7 大類 60+ 項 SSO）、校園行事曆。
   每項一句使用者價值描述（素材：`sources/01-app.md` §1 的 19 項功能表）。
3. **完整功能清單**：其餘功能（課前通知、小郵差、教學評量、票選、選課確認、失物招領、
   作業清單、課表匯入/範本、課表分享、訪客模式）以精簡條列呈現。
4. **訪客模式 CTA**：「還沒有北科帳號？訪客模式直接體驗」，瞄準準新生。
5. **生態系服務**：排課系統（course.ntutbox.com，帶「11 學期、32,338 筆開課、每日更新」數字）、
   服務狀態頁（status.ntutbox.com）。範本 API 只放 footer 開發者連結。
6. **Footer**：非官方免責聲明（必放，全文見 §3）、隱私、支援、狀態頁、GitHub、IG、© PoterPan。

## 2. 視覺與素材

- 設計語言：Apple / Liquid-Glass 風，繼承 `ntutbox-course/apps/web/src/app/globals.css` 的
  token 系統與該 repo AGENTS.md 設計規範。明暗雙主題（`prefers-color-scheme`）。
- 色票：accent `#3b82f6`；accent-ink light `#1d4ed8` / dark `#93b4fb`；ink `#141a24` / `#f1f4fa`；
  theme-color light `#eef2fb` / dark `#0f131c`。
- 素材來源：
  - App icon：iTunes lookup API（`itunes.apple.com/lookup?id=6753217696&country=tw`）的
    1024px artwork；使用者日後提供原始檔可替換。
  - App 截圖：App Store 現行公開截圖（已是行銷素材、無個資）。
  - OG 圖：先用現成 `https://assets.ntutbox.com/og-share.png`；日後可從
    `/Users/poterpan/Documents/Coding/NTUT/NTUTBox-OG-image.psd` 重出官網專屬版。
- Logo 明暗兩版在 NTUTBox repo `NTUTBox/Assets.xcassets/NTUT_Box_Logo_{light,dark}.imageset`。

## 3. 文案鐵則（實作與驗收都要逐條對照）

1. Live Activity / 動態島 → 一律標「開發中，逐步完善」。
2. Web→App 選課計畫匯入 → 不寫，或僅「規劃中」。
3. 微學程 → 不出現（未上線）。
4. 平台：「為 iPhone 設計，iPad 與 Apple Silicon Mac 亦可安裝使用」；不寫 visionOS、不寫「Mac 版」。
5. 非官方免責聲明（footer 必放）：「本 App 為非官方應用程式，與國立臺北科技大學無正式關聯。
   所有課表資料來源於 NTUT 官方教務系統。」
6. 隱私聲明素材：「本 App 不會儲存或上傳您的密碼到任何第三方伺服器；密碼使用 iOS Keychain
   安全儲存於本地裝置；僅在需要時與 NTUT 官方伺服器進行認證。」
7. 任何示意圖／截圖不可含真實學號、班級、姓名（App Store 現行截圖已符合）。
8. 規劃中功能可標「即將推出」：多學期課表查詢、iCal 匯出。

## 4. 技術架構

- Next.js 16（App Router，`output: 'export'` 全靜態）＋ Tailwind 4 ＋ TypeScript。
- 元件慣例與設計 token 照 `ntutbox-course`（該 repo 有 AGENTS.md 設計規範）。
- 部署：Cloudflare Workers static assets；GitHub public repo（MIT），Cloudflare Git 整合 push 即部署。
- SEO：per-page metadata、OG/Twitter card、`sitemap.xml`、`robots.txt`、
  `SoftwareApplication` JSON-LD（含 App Store 評分 4.83/18 則——上線前再抓最新值）。
- 首版全靜態、無動態內容；範本 API 暫不使用。

## 5. 網域遷移計畫（獨立最後階段，逐步與使用者確認後執行）

> 鐵則：AASA 一斷，App 的 Universal Links 與密碼自動填入就壞。每步之間都要驗證。
> ntutbox-edge 是 Cloudflare 原生 Git 整合部署，route 在 Dashboard 手動管理。

1. 為 ntutbox-edge 加精確 route：`ntutbox.com/.well-known/*`、`ntutbox.com/share/*`
   （精確 route 優先於萬用字元）。
2. 驗證 `/.well-known/apple-app-site-association` 回應與遷移前 byte 相同。
3. 移除 edge 的 `ntutbox.com/*` route；官網 Worker 綁 `ntutbox.com/*`。
4. 復驗三件事：AASA 不變、`/share/{id}` fallback 正常、官網首頁 200。
5. 綁 `status.ntutbox.com` → ntutbox-uptime.pages.dev。
6. 使用者本人到 App Store Connect 更新 Support URL（`ntutbox.com/support`）、
   Marketing URL（`ntutbox.com`）、Privacy Policy URL（`ntutbox.com/privacy`）。
   ——此步驟屬對外正式送出，只準備清單，不代操作。

## 6. 驗收條件

1. `next build` 靜態 export 成功，無 type error。
2. `/`、`/privacy`、`/support`、404 四頁在本機與 Cloudflare preview 正常渲染，明暗主題皆正確。
3. §3 文案鐵則逐條 pass（由 fresh-context agent 對照原文驗收）。
4. SEO 檢查：metadata、OG、sitemap、JSON-LD 存在且值正確。
5. 遷移後 AASA 與 `/share/*` 行為與遷移前一致（curl 比對）。
6. RWD：行動版（iPhone 寬度）與桌面版皆無破版。

## 7. 相關路徑

- Brief：`/Users/poterpan/Documents/Coding/NTUT/ntutbox-website-brief/`
- 排課系統（token/慣例來源）：`/Users/poterpan/Documents/Coding/NTUT/ntutbox-course`
- edge Worker：`/Users/poterpan/Documents/Coding/NTUT/ntutbox-edge`
- 狀態頁：`/Users/poterpan/Documents/Coding/NTUT/ntutbox-uptimeflare`
- iOS App：`/Users/poterpan/Documents/Coding/SwiftUI/NTUTBox`
