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
