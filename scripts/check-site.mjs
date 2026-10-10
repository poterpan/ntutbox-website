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
const REQUIRED_FILES = ["index.html", "app-icon.png", "og.png", "favicon.png", "apple-touch-icon.png", "qr-appstore.svg", "privacy/index.html", "terms/index.html", "support/index.html", "about/index.html", "guide/selection/index.html", "404.html", "sitemap.xml", "robots.txt"];
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
  if (/Live Activity|動態島/.test(html) && !(html.includes("開發中") && html.includes("逐步完善"))) {
    fail(`${file} 提到 Live Activity／動態島但未同時標「開發中」與「逐步完善」`);
  }
}

// ── 3b. 同意前零 Google 資源（GA4 opt-in 的核心承諾）──
// 靜態 HTML 裡不得出現任何 Google 測量網域：載入 gtag.js 的元件只在
// consent === "granted" 時由客戶端 render，prerender 產物必須乾淨。
// 注意：JS chunk 內出現這些字串是正常的（同意後才執行），這裡只掃 HTML。
const GOOGLE_TAG_HOSTS = ["googletagmanager.com", "google-analytics.com", "/g/collect"];
for (const file of allHtmlFiles()) {
  const html = readFileSync(file, "utf8");
  for (const host of GOOGLE_TAG_HOSTS) {
    if (html.includes(host)) fail(`${file} 無條件引用了 Google 測量資源「${host}」（同意前不得載入）`);
  }
  // preconnect/dns-prefetch 也算搶跑
  if (/<link[^>]+(googletagmanager|google-analytics)/.test(html)) {
    fail(`${file} 有指向 Google 測量網域的 <link> 預連線`);
  }
  // 事件參數不得夾帶敏感 query key（規格 §6 禁止清單）
  for (const key of ["plan=", "payload=", "offering_id="]) {
    if (html.includes(`gtag`) && html.includes(key)) {
      fail(`${file} 同時出現 gtag 與敏感參數「${key}」`);
    }
  }
}

// ── 4. 各頁內容斷言（隨任務增長；缺檔已在 §1 報告，這裡跳過）──
const PAGE_ASSERTIONS = {
  "index.html": [
    // Footer（Task 4）
    "本 App 為非官方應用程式，與國立臺北科技大學無正式關聯。所有課表資料來源於 NTUT 官方教務系統。",
    "© 2026 PoterPan",
    "/privacy/",
    "/terms/",
    "/support/",
    "status.ntutbox.com",
    "instagram.com/ntutbox_official",
    "threads.com/@ntutbox_official",
    "github.com/poterpan/ntutbox-course",
    "github.com/poterpan/ntutbox-template-api",
    // Landing（Task 5）
    "apps.apple.com/tw/app/id6753217696",
    "ct=website", // 下載入口需帶 campaign 參數（App 分析歸因）
    "qr-appstore.svg", // Hero 桌面版 QR
    "手機掃描下載",
    "提供北科學生方便的校務體驗",
    "iPad 與 Apple Silicon Mac 亦可安裝使用",
    "訪客模式",
    "course.ntutbox.com",
    "application/ld+json",
    "期末預選選課",
    "開發中",
    "★", // hero 可見評分（React SSR 會在插值間插 <!-- -->，勿用完整句斷言）
    // SEO（Task 8 + canonical 硬化）
    'property="og:image"',
    'rel="canonical"',
    "北科盒子 NTUTBox — 北科大學生的智慧課表 App",
    // 站名結構化資料：Google「網站名稱」吃首頁 WebSite，缺了會顯示裸網域
    '"@type":"WebSite"',
    '"@type":"SoftwareApplication"',
    '"alternateName":"NTUTBox"',
    // schema 枚舉與型別硬化：applicationCategory 需為合法枚舉值、ratingCount 為數字
    '"applicationCategory":"EducationalApplication"',
    '"contentRating":"4+"',
    '"ratingCount":18',
  ],
  "404.html": [
    "找不到",
    "回首頁",
  ],
  "privacy/index.html": [
    "隱私權政策",
    "登入所需資訊僅儲存於您的裝置",
    "直接傳送至北科大官方系統",
    "最後更新",
    "TelemetryDeck",
    "資料保留與刪除",
    "關閉匿名統計",
    // 網站分析揭露（規格 §4 六項必要涵蓋內容，各取一段不跨插值邊界的字串）
    "網站分析與廣告成效",
    "Google Analytics 4",
    "於您明確同意之前",
    "第一方 cookie",
    "事件資料保存期限為 2 個月",
    "不做廣告個人化",
    "不收集帳號密碼、學號、姓名、班級、搜尋文字、課程選擇",
    "隨時於下方「分析設定」撤回",
    "移除與分析目的無關、可能含識別資訊之參數",
    "policies.google.com/privacy",
    // 可撤回同意的入口
    "分析設定",
    // 北科盒子會員（2.10.0）：揭露項目各取一段不跨插值邊界的字串
    "北科盒子會員",
    "學號與信箱不會顯示給其他使用者",
    "上傳後 90 天自動刪除",
    "裝置驗證",
    "刪除會員資料",
    "個人資料保護法",
    "/terms/",
  ],
  "terms/index.html": [
    "使用條款",
    "零容忍",
    "檢舉",
    "封鎖",
    "停權",
    "準據法",
    "收到檢舉後 24 小時內處置",
    "/privacy/",
  ],
  "support/index.html": [
    "常見問題",
    "instagram.com/ntutbox_official",
    "poter.pan@panspace.me",
    "status.ntutbox.com",
    "完全免費", // FAQ 擴充（Task：6→13 條）
  ],
  "about/index.html": [
    "關於開發者",
    "PoterPan",
    "Apple 原生",
  ],
  "guide/selection/index.html": [
    "選課指南",
    "course.ntutbox.com",
    "排課系統",
  ],
};
for (const [page, terms] of Object.entries(PAGE_ASSERTIONS)) {
  if (!exists(page)) continue;
  const html = read(page);
  for (const t of terms) {
    if (!html.includes(t)) fail(`out/${page} 缺少必要內容「${t}」`);
  }
}

// ── 4b. 已作廢的承諾（留著就會與實際行為不符）──
const PAGE_FORBIDDEN = {
  // 官網啟用 opt-in GA4 後，舊文「不使用 cookie／不埋設分析程式」不再為真
  "privacy/index.html": ["不埋設任何追蹤或分析程式", "不蒐集任何個人資料", "永久停權"],
  // 停權改稱「無限期停權」：刪除會員後識別值最長只保存一年，寫「永久」不符實際
  "terms/index.html": ["永久停權"],
};
for (const [page, terms] of Object.entries(PAGE_FORBIDDEN)) {
  if (!exists(page)) continue;
  const html = read(page);
  for (const t of terms) {
    if (html.includes(t)) fail(`out/${page} 仍含已作廢文案「${t}」`);
  }
}

// ── 4c. 法律文件的待確認標記：草稿用來標出還沒核實的事實，留著上線等於對外承諾了一句沒確認的話 ──
for (const file of allHtmlFiles()) {
  const pending = readFileSync(file, "utf8").match(/【待(?:確認|補)：[^】]*】/g);
  // RSC payload 會把同一段文字再印一次，所以去重
  if (pending) {
    const unique = [...new Set(pending)];
    fail(`${file} 仍有 ${unique.length} 處待確認標記：\n      ${unique.join("\n      ")}`);
  }
}

// ── 5. Sitemap 驗證（Task 8）──
if (exists("sitemap.xml")) {
  const sm = read("sitemap.xml");
  for (const u of [
    "https://ntutbox.com/",
    "https://ntutbox.com/privacy/",
    "https://ntutbox.com/terms/",
    "https://ntutbox.com/support/",
    "https://ntutbox.com/about/",
    "https://ntutbox.com/guide/selection/",
  ]) {
    if (!sm.includes(`<loc>${u}</loc>`)) fail(`sitemap.xml 缺少 ${u}`);
  }
}

if (failures.length) {
  console.error(`✗ check-site 失敗（${failures.length} 項）：`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}
console.log("✓ check-site 全部通過");
