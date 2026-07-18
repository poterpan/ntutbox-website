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
