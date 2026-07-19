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
