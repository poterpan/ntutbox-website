/**
 * @vitest-environment-options { "url": "https://ntutbox.com/plan/" }
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanHandoff } from "./PlanHandoff";

/** spec §3 的合法 payload，欄位齊全。 */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    u: "ntut",
    t: "115-1",
    d: "2026-08-30T02:11:00Z",
    x: 1725336000,
    c: [
      {
        i: "360744",
        n: "微積分（一）",
        r: 3,
        h: ["王小明"],
        m: [[1, "78"]],
        l: "綜科館 502",
        q: "required",
        p: 1,
        s: 1,
      },
      {
        i: "360745",
        n: "普通物理",
        r: 3,
        h: ["李小華"],
        m: [[2, "3"]],
        l: "綜科館 503",
        q: "elective",
        p: 2,
        s: 1,
      },
    ],
    ...overrides,
  };
}

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 用瀏覽器與元件本身都用的同一個 Compression API 家族壓，避免測試自己另寫一套編碼邏輯。
 *  泛型標成 Uint8Array<ArrayBuffer> 是跟 PlanHandoff.tsx 同一個理由：
 *  TS 5.7+ 的 lib.dom 把 TypedArray 換成泛型，裸 `Uint8Array` 對不上
 *  CompressionStream 宣告的 pipeThrough 型別。 */
async function deflateRaw(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(c) {
      c.enqueue(bytes);
      c.close();
    },
  }).pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** 組出 `#v=1&e=<0|1>&p=...` 這種 fragment，比照 spec §3 的連結形狀。 */
async function buildHash(payload: unknown, { compressed }: { compressed: boolean }): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const bytes = compressed ? await deflateRaw(json) : json;
  return `#v=1&e=${compressed ? "1" : "0"}&p=${bytesToBase64url(bytes)}`;
}

function setHash(hash: string) {
  window.location.hash = hash;
}

describe("PlanHandoff", () => {
  it("合法 payload（壓縮）render 出課數與學期標題", async () => {
    setHash(await buildHash(validPayload(), { compressed: true }));
    render(<PlanHandoff />);
    expect(await screen.findByText("115-1 2 門預排課程")).toBeInTheDocument();
    expect(
      screen.getByText(
        "這份預排課表要在「北科盒子」App 裡開啟。安裝後再點一次原本的連結，就會直接匯入成草稿。",
      ),
    ).toBeInTheDocument();
  });

  it("合法 payload（未壓縮 e=0）走同一條解碼路徑，一樣 render 出標題", async () => {
    setHash(await buildHash(validPayload(), { compressed: false }));
    render(<PlanHandoff />);
    expect(await screen.findByText("115-1 2 門預排課程")).toBeInTheDocument();
  });

  it("u 不是 ntut（外校／偽造來源）退回通用文案，不渲染資料衍生的標題", async () => {
    setHash(await buildHash(validPayload({ u: "ntu" }), { compressed: true }));
    render(<PlanHandoff />);
    // 標題預設就是通用文案，這裡等到 effect 真的跑完（呼叫 findBy 會 poll），
    // 確認解碼路徑本身回傳了「無法解讀」而不是巧合地還沒開始跑。
    await screen.findByText("這個連結要在安裝了「北科盒子」App 的 iPhone 上開啟。");
    expect(screen.getByText("預排課表")).toBeInTheDocument();
    expect(screen.queryByText(/門預排課程/)).not.toBeInTheDocument();
  });

  it("缺少 u 欄位一樣視為無法解讀，退回通用文案", async () => {
    const { u: _u, ...withoutU } = validPayload();
    void _u;
    setHash(await buildHash(withoutU, { compressed: true }));
    render(<PlanHandoff />);
    await screen.findByText("這個連結要在安裝了「北科盒子」App 的 iPhone 上開啟。");
    expect(screen.getByText("預排課表")).toBeInTheDocument();
  });

  it("沒有 fragment 時直接顯示通用文案（不留在 loading 狀態）", async () => {
    setHash("");
    render(<PlanHandoff />);
    expect(screen.getByText("預排課表")).toBeInTheDocument();
    // readHandoff 即使同步回傳 null 也是走一次 microtask，等它跑完再斷言，
    // 避免 effect 的 setState 落在測試結束之後才觸發 act() 警告。
    await screen.findByText("這個連結要在安裝了「北科盒子」App 的 iPhone 上開啟。");
  });
});
