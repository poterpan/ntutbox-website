"use client";

import { useEffect, useState } from "react";
import { AppStoreButton } from "@/components/site/app-store-button";

/** spec §3 的 wire format。這裡只宣告落地頁用得到的部分。 */
interface PlanPayloadHead {
  u?: string;
  t?: string;
  c?: unknown[];
}

function base64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4 !== 0) t += "=";
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** 刻意不用 `new Blob([...]).stream()`：jsdom 的 Blob 沒有 .stream()，
 *  那個寫法在瀏覽器可行但在 vitest 環境會 TypeError（2026-09-03 實測）。
 *  直接建 ReadableStream 在兩邊都可行。
 *  回傳型別明確標成 Uint8Array<ArrayBuffer>：TS 5.7+ 的 lib.dom 把
 *  TypedArray 換成泛型（Uint8Array<ArrayBufferLike>），若讓型別停在裸
 *  `Uint8Array` 會在 pipeThrough(DecompressionStream) 那行對不上
 *  DecompressionStream 宣告的 Uint8Array<ArrayBuffer>。 */
function bytesToStream(bytes: Uint8Array<ArrayBuffer>): ReadableStream<Uint8Array<ArrayBuffer>> {
  return new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(c) {
      c.enqueue(bytes);
      c.close();
    },
  });
}

async function inflateRaw(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = bytesToStream(bytes).pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readHandoff(hash: string): Promise<{ count: number; termKey: string } | null> {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;
  const p = new URLSearchParams(raw);
  const encoded = p.get("p");
  if (!encoded) return null;
  if (p.get("v") !== "1") return null; // 不認識的 schema 版本就只顯示通用文案
  try {
    let bytes = base64urlToBytes(encoded);
    if (p.get("e") === "1") bytes = await inflateRaw(bytes);
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as PlanPayloadHead;
    // 學校 provenance 在接收端強制（spec §3〈學校 provenance 在接收端強制〉）：
    // 這個落地頁只認得出北科的資料，缺欄或不是 "ntut" 一律當成無法解讀，
    // 不能渲染出這頁沒資格保證來源的標題。
    if (payload.u !== "ntut") return null;
    const count = Array.isArray(payload.c) ? payload.c.length : 0;
    if (count <= 0) return null;
    return { count, termKey: typeof payload.t === "string" ? payload.t : "" };
  } catch {
    return null; // 壞連結不是錯誤畫面，退回通用文案
  }
}

export function PlanHandoff() {
  const [info, setInfo] = useState<{ count: number; termKey: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void readHandoff(window.location.hash).then((r) => {
      if (cancelled) return;
      setInfo(r);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const heading = info
    ? `${info.termKey ? `${info.termKey} ` : ""}${info.count} 門預排課程`
    : "預排課表";

  return (
    <div className="mx-auto max-w-xl px-6 pb-24 pt-32">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{heading}</h1>
      <p className="mt-3 leading-7 text-[var(--ink-soft)]">
        {ready && info
          ? "這份預排課表要在「北科盒子」App 裡開啟。安裝後再點一次原本的連結，就會直接匯入成草稿。"
          : "這個連結要在安裝了「北科盒子」App 的 iPhone 上開啟。"}
      </p>

      {/* placement="plan"：報表要能分辨這個入口帶來的下載（審查回合 1 修正，spec §6）。
          元件內部已用 APP_STORE_CAMPAIGN_URL（帶 ct=website），這裡不需另外指定網址。 */}
      <AppStoreButton placement="plan" className="mt-8" />

      <p className="mt-6 text-[13px] leading-6 text-[var(--ink-faint)]">
        課表內容放在網址的 fragment 裡，不會傳送到我們的伺服器。
      </p>
    </div>
  );
}
