#!/usr/bin/env node
/**
 * GA4 opt-in 的瀏覽器驗收：對 `out/` 的真實靜態產物跑完整同意生命週期。
 *
 * 為什麼需要這支（單元測試補不上的部分）：
 * - 單元測試把 `next/script` mock 掉了，所以「inline bootstrap 在真瀏覽器裡真的執行、
 *   dataLayer 順序真的正確」只能靠真瀏覽器驗。
 * - 「同意前零 Google 請求」是隱私承諾。unit test 只能斷言元件沒 render，
 *   真正該證明的是**網路層一個請求都沒發**——只有真瀏覽器數得出來。
 * - `page_view` 送出的值不等於 GA 實際打上去的 query；這支會檢查真實
 *   `/g/collect` 請求裡沒有 plan / payload / token。
 *
 * 刻意**不進 CI**：Cloudflare Workers Builds 只跑 `pnpm install && pnpm build`，
 * 為了一支手動驗收把 playwright 塞進 devDependencies 會讓每次 production build
 * 都多下載一套瀏覽器。因此 playwright 用「自備」策略，見下方 usage。
 *
 * 用法：
 *   1. 用啟用 GA 的 env 建置（out/ 必須含 Measurement ID，否則本腳本會拒跑）：
 *        NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST123456 \
 *        NEXT_PUBLIC_GA_ENABLED=true NEXT_PUBLIC_GA_DEBUG=true pnpm build
 *      （DEBUG=true 是必要的：hostname allowlist 只放行 ntutbox.com 三個網域，
 *        本機驗收得靠它放行 localhost。務必搭配**測試用** Measurement ID。）
 *   2. 自備 playwright，二擇一：
 *        pnpm add -D playwright && pnpm exec playwright install chrome
 *        # 或指向既有安裝：PLAYWRIGHT_PATH=/path/to/node_modules/playwright/index.mjs
 *   3. pnpm verify:consent
 *
 * 環境變數：PLAYWRIGHT_PATH（playwright 模組路徑）、PORT（預設 4321）。
 */
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const OUT = "out";
const PORT = Number(process.env.PORT ?? 4321);
const BASE = `http://localhost:${PORT}`;
const GOOGLE = /googletagmanager\.com|google-analytics\.com|\/g\/collect|doubleclick\.net/;

// ── 前置檢查：out/ 必須是「啟用 GA」的建置，否則整份驗收沒有意義 ──
if (!existsSync(join(OUT, "index.html"))) {
  console.error(`✗ 找不到 ${OUT}/index.html——請先 pnpm build`);
  process.exit(2);
}
const chunkDir = join(OUT, "_next", "static", "chunks");
const hasId =
  existsSync(chunkDir) &&
  readdirSync(chunkDir).some(
    (f) => f.endsWith(".js") && /G-[A-Z0-9]{4,20}/.test(readFileSync(join(chunkDir, f), "utf8")),
  );
if (!hasId) {
  console.error(
    "✗ out/ 不含 Measurement ID：這份建置沒啟用 GA，驗收會全部假通過。\n" +
      "  請用檔頭 usage 的 env 重新 pnpm build。",
  );
  process.exit(2);
}

// ── playwright 自備（不進 devDependencies，理由見檔頭）──
let chromium;
try {
  ({ chromium } = await import(process.env.PLAYWRIGHT_PATH ?? "playwright"));
} catch {
  console.error(
    "✗ 找不到 playwright。請 `pnpm add -D playwright && pnpm exec playwright install chrome`，\n" +
      "  或用 PLAYWRIGHT_PATH 指向既有安裝（見檔頭 usage）。",
  );
  process.exit(2);
}

// ── 最小靜態伺服器（trailingSlash: true → /privacy/ 對應 out/privacy/index.html）──
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, BASE).pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(OUT, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(PORT, resolve));

const results = [];
const check = (name, ok, detail = "") =>
  results.push({ name, ok, detail: typeof detail === "string" ? detail : JSON.stringify(detail) });
const dataLayerOf = (page, filter) =>
  page.evaluate(
    ([f]) =>
      (window.dataLayer ?? [])
        .map((e) => Array.from(e))
        .filter((e) => !f || (e[0] === f[0] && e[1] === f[1]))
        .map((e) => (f ? e[2] : e)),
    [filter],
  );

// 用系統 Chrome：本機常見的是 playwright 版本與已下載 chromium 不匹配
const browser = await chromium.launch({ channel: "chrome" });

try {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const googleHits = [];
  page.on("request", (r) => {
    if (GOOGLE.test(r.url())) googleHits.push(r.url());
  });

  // ── 1. 首次造訪：同意前不得有任何 Google 請求 ──
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  check("同意前無任何 Google 請求", googleHits.length === 0, googleHits.join(", "));
  check("同意前 window.gtag 不存在", (await page.evaluate(() => typeof window.gtag)) === "undefined");
  check(
    "同意前沒有 consent cookie",
    !(await page.evaluate(() => document.cookie)).includes("ntutbox_analytics_consent"),
    await page.evaluate(() => document.cookie),
  );
  check("同意 UI 出現", await page.getByRole("button", { name: "同意成效分析" }).isVisible());
  check("拒絕按鈕同樣可見", await page.getByRole("button", { name: "拒絕" }).isVisible());

  // ── 2. 按下同意 ──
  await page.getByRole("button", { name: "同意成效分析" }).click();
  await page.waitForTimeout(2000);

  check(
    "同意後寫入 granted_v1",
    (await page.evaluate(() => document.cookie)).includes("ntutbox_analytics_consent=granted_v1"),
  );
  check("同意 UI 收起", (await page.getByRole("button", { name: "同意成效分析" }).count()) === 0);
  check(
    "同意後才請求 gtag.js",
    googleHits.some((u) => u.includes("googletagmanager.com/gtag/js")),
    googleHits.slice(0, 3).join(", "),
  );
  check("同意後 window.gtag 已定義", (await page.evaluate(() => typeof window.gtag)) === "function");

  const entries = await dataLayerOf(page);
  const commands = entries.map((e) => `${e[0]}|${e[1]}`);
  check("dataLayer 有 consent default", commands.includes("consent|default"), commands.join(" / "));
  check("dataLayer 有 consent update", commands.includes("consent|update"));
  check(
    "consent default 在 update 之前",
    commands.indexOf("consent|default") < commands.indexOf("consent|update"),
  );

  const [defaultArg] = await dataLayerOf(page, ["consent", "default"]);
  const [updateArg] = await dataLayerOf(page, ["consent", "update"]);
  check(
    "default 四項皆 denied",
    JSON.stringify(defaultArg) ===
      JSON.stringify({
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
      }),
    defaultArg,
  );
  check("update 後 analytics_storage granted", updateArg?.analytics_storage === "granted", updateArg);
  check("update 後 ad_personalization 仍 denied", updateArg?.ad_personalization === "denied", updateArg);

  // config 的第二個引數是 Measurement ID，不是固定字串，所以不走 dataLayerOf 的雙鍵過濾
  const [configArg] = await page.evaluate(() =>
    (window.dataLayer ?? [])
      .map((e) => Array.from(e))
      .filter((e) => e[0] === "config")
      .map((e) => e[2]),
  );
  check("config 關閉自動 page_view", configArg?.send_page_view === false, configArg);
  check("config cookie_domain=auto", configArg?.cookie_domain === "auto");

  const pageViews = await dataLayerOf(page, ["event", "page_view"]);
  // Strict Mode 的雙跑 effect 曾讓這裡變成 2；PageViewTracker 用 ref 對 pathname 去重
  check("送出恰好一次 page_view", pageViews.length === 1, `count=${pageViews.length}`);
  check("page_view 帶 site_surface=website", pageViews[0]?.site_surface === "website", pageViews[0]);

  // ── 3. App Store 連結：導頁前送出 app_store_click ──
  await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find((el) =>
      el.textContent?.includes("在 App Store 下載"),
    );
    a?.setAttribute("target", "_self");
    a?.addEventListener("click", (e) => e.preventDefault(), true);
    a?.click();
  });
  await page.waitForTimeout(400);
  const clicks = await dataLayerOf(page, ["event", "app_store_click"]);
  check("app_store_click 送出且 placement=hero", clicks[0]?.placement === "hero", clicks);
  check(
    "app_store_click 不含敏感 key",
    clicks.every(
      (c) => !Object.keys(c ?? {}).some((k) => ["plan", "course", "payload", "token", "code"].includes(k)),
    ),
    clicks,
  );

  // ── 4. 帶敏感 query 的網址：清洗必須生效（含真實 collect 請求）──
  const page2 = await ctx.newPage();
  const hits2 = [];
  page2.on("request", (r) => {
    if (GOOGLE.test(r.url())) hits2.push(r.url());
  });
  await page2.goto(
    `${BASE}/?term=115-1&plan=360744.360745&payload=secret&token=tok&utm_source=google&gclid=abc123#frag`,
    { waitUntil: "networkidle" },
  );
  await page2.waitForTimeout(1800);
  const pv2 = await dataLayerOf(page2, ["event", "page_view"]);
  const pv2json = JSON.stringify(pv2);
  check(
    "page_view 保留 UTM 與 gclid",
    pv2[0]?.page_location?.includes("utm_source=google") && pv2[0]?.page_location?.includes("gclid=abc123"),
    pv2[0],
  );
  check(
    "page_view 移除 plan/payload/token/hash",
    !pv2json.includes("360744") &&
      !pv2json.includes("secret") &&
      !pv2json.includes("tok") &&
      !pv2json.includes("frag"),
    pv2json,
  );
  check(
    "term 轉成 term_key 且不留在網址",
    pv2[0]?.term_key === "115-1" && !pv2[0]?.page_location?.includes("term="),
    pv2[0],
  );
  const collect = hits2.filter((u) => u.includes("/collect"));
  check(
    "實際 collect 請求不含敏感值",
    collect.every((u) => !u.includes("360744") && !u.includes("secret") && !/[?&]tok/.test(u)),
    collect.slice(0, 2).join(" ") || "(尚無 collect 請求)",
  );
  await page2.close();

  // ── 5. 隱私頁撤回同意 ──
  await page.goto(`${BASE}/privacy/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  check("隱私頁顯示已同意狀態", await page.getByText("目前狀態：已同意匿名成效分析。").isVisible());
  await page.getByRole("button", { name: "撤回同意" }).click();
  await page.waitForTimeout(600);
  check(
    "撤回後寫入 denied_v1",
    (await page.evaluate(() => document.cookie)).includes("ntutbox_analytics_consent=denied_v1"),
    await page.evaluate(() => document.cookie),
  );
  check(
    "撤回後清掉 _ga cookie",
    !(await page.evaluate(() => document.cookie)).includes("_ga"),
    await page.evaluate(() => document.cookie),
  );
  const denies = await dataLayerOf(page, ["consent", "update"]);
  check("撤回時送出 consent update denied", denies.at(-1)?.analytics_storage === "denied", denies.at(-1));

  // ── 6. 撤回後重整：不再載入、不再詢問、不再送事件 ──
  googleHits.length = 0;
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  check("撤回後重整不再載入 Google 資源", googleHits.length === 0, googleHits.join(", "));
  check("撤回後不再詢問", (await page.getByRole("button", { name: "同意成效分析" }).count()) === 0);
  check("撤回後不再送事件", (await page.evaluate(() => (window.dataLayer ?? []).length)) === 0);

  // ── 7. 拒絕路徑（全新 context，模擬新訪客）──
  const ctx2 = await browser.newContext();
  const page3 = await ctx2.newPage();
  const hits3 = [];
  page3.on("request", (r) => {
    if (GOOGLE.test(r.url())) hits3.push(r.url());
  });
  await page3.goto(BASE, { waitUntil: "networkidle" });
  await page3.getByRole("button", { name: "拒絕" }).click();
  await page3.waitForTimeout(800);
  check(
    "拒絕後寫入 denied_v1",
    (await page3.evaluate(() => document.cookie)).includes("ntutbox_analytics_consent=denied_v1"),
  );
  await page3.reload({ waitUntil: "networkidle" });
  await page3.waitForTimeout(1200);
  check("拒絕後維持不載入", hits3.length === 0, hits3.join(", "));
  check("拒絕後不再詢問", (await page3.getByRole("button", { name: "同意成效分析" }).count()) === 0);
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `  → ${r.detail}`}`);
if (failed.length) {
  console.error(`\n✗ verify-consent 失敗（${failed.length}/${results.length}）`);
  process.exit(1);
}
console.log(`\n✓ verify-consent 全部通過（${results.length} 項）`);
