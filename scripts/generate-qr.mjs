#!/usr/bin/env node
// 產生 Hero 用的 App Store 下載 QR code（styled SVG，commit 進 repo）。
// 連結變更時重跑：pnpm generate-qr
// 樣式：圓點模組 + 三個圓角同心定位框，墨色（--ink light 值）配白底；
// 中央由元件疊 app icon（ECC H 容錯 30%，icon 佔比 ~6% 面積，安全）。
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";

// 與 src/content/site.ts 的 APP_STORE_CAMPAIGN_URL 保持一致（ct=website）
const URL = "https://apps.apple.com/app/apple-store/id6753217696?pt=126597733&ct=website&mt=8";

const qr = QRCode.create(URL, { errorCorrectionLevel: "H" });
const size = qr.modules.size;
const data = qr.modules.data;

const CELL = 8; // 每模組 px
const QUIET = 2; // 靜區（模組數）；白卡本身提供額外留白
const DIM = (size + QUIET * 2) * CELL;
const INK = "#141a24";

const inFinder = (r, c) =>
  (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);

const px = (m) => (m + QUIET) * CELL;

let parts = [];
parts.push(`<rect width="${DIM}" height="${DIM}" fill="#ffffff"/>`);

// 資料模組：圓點
for (let r = 0; r < size; r++) {
  for (let c = 0; c < size; c++) {
    if (!data[r * size + c] || inFinder(r, c)) continue;
    parts.push(
      `<circle cx="${px(c) + CELL / 2}" cy="${px(r) + CELL / 2}" r="${(CELL * 0.9) / 2}" fill="${INK}"/>`,
    );
  }
}

// 定位框：外 7×7 圓角環 + 內 3×3 圓角實心
for (const [fr, fc] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
  const x = px(fc);
  const y = px(fr);
  parts.push(
    `<rect x="${x}" y="${y}" width="${7 * CELL}" height="${7 * CELL}" rx="${2.2 * CELL}" fill="${INK}"/>`,
    `<rect x="${x + CELL}" y="${y + CELL}" width="${5 * CELL}" height="${5 * CELL}" rx="${1.6 * CELL}" fill="#ffffff"/>`,
    `<rect x="${x + 2 * CELL}" y="${y + 2 * CELL}" width="${3 * CELL}" height="${3 * CELL}" rx="${CELL}" fill="${INK}"/>`,
  );
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DIM} ${DIM}">${parts.join("")}</svg>\n`;
writeFileSync("public/qr-appstore.svg", svg);
console.log(`✓ public/qr-appstore.svg（${size}×${size} 模組，ECC H）`);
