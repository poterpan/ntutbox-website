<div align="center">

<img src="public/app-icon.png" alt="北科盒子" width="96" height="96" style="border-radius: 22px" />

# 北科盒子官網

**[ntutbox.com](https://ntutbox.com)** — 北科大學生的智慧課表 App「北科盒子（NTUT Box）」官方網站

[![App Store](https://img.shields.io/badge/App_Store-下載-0D96F6?logo=apple&logoColor=white)](https://apps.apple.com/tw/app/id6753217696)
[![排課系統](https://img.shields.io/badge/排課系統-course.ntutbox.com-3b82f6)](https://course.ntutbox.com)
[![服務狀態](https://img.shields.io/badge/服務狀態-status.ntutbox.com-22c55e)](https://status.ntutbox.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

## 技術

| | |
|---|---|
| 框架 | Next.js 16（App Router，`output: "export"` 全靜態） |
| 樣式 | Tailwind 4（純 CSS `@theme`）＋ Apple / Liquid-Glass 設計 token（繼承 [ntutbox-course](https://github.com/poterpan/ntutbox-course)） |
| 部署 | Cloudflare Workers（static assets）＋ Workers Builds CI（push `main` 自動部署） |
| 驗收 | `scripts/check-site.mjs` 對靜態輸出做文案鐵則與 SEO 硬斷言 |

## 開發

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # 靜態 export 到 out/
pnpm check          # 內容驗收（merge 前必跑）
pnpm preview        # wrangler dev 本機模擬 Cloudflare 環境
```

**分支規則**：`main` 即 production（CI 自動部署），所有變更請開 PR，
由 Workers Builds 的 version preview URL 預覽。開發規範詳見 [CLAUDE.md](CLAUDE.md)。

## 頁面

| 路徑 | 內容 |
|---|---|
| `/` | Landing：功能介紹、App 截圖、訪客模式、生態系服務 |
| `/privacy` | 隱私權政策 |
| `/support` | 支援與常見問題 |

## 北科盒子生態系

- 📱 [北科盒子 App](https://apps.apple.com/tw/app/id6753217696) — iOS 智慧課表（本體）
- 🗓️ [排課系統](https://course.ntutbox.com)（[開源](https://github.com/poterpan/ntutbox-course)）— 免登入網頁版排課規劃器
- 📊 [服務狀態頁](https://status.ntutbox.com) — 北科校務系統即時監控
- 🔌 [課表範本 API](https://github.com/poterpan/ntutbox-template-api)（開源）— 各大學節次範本公開 API

> 北科盒子為北科學生獨立開發的非官方應用程式，與國立臺北科技大學無正式關聯。

## License

MIT © 2026 [PoterPan](https://github.com/poterpan)
