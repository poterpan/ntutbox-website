/**
 * 原始碼不得含 raw control byte。
 *
 * 為什麼要一條測試守這件事：`analytics.test.ts` 曾把 `"goo\x00gle"` 寫成**真實 NUL 位元組**
 * （撰寫時跳脫序列被實體化了）。後果不是測試失敗——測試照樣全綠——而是 `grep` 把整份
 * 548 行的測試檔判定為 binary 並**靜默跳過**：任何靠 grep 的 review、CI 檢查、
 * 全庫搜尋都會漏看整個檔案。無聲失效的東西必須由斷言擋，不能靠下次記得。
 *
 * 需要控制字元當測資時，用 `String.fromCharCode(0)` 之類的方式在執行期組出來。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
/* 只掃我們自己寫的文字檔；二進位素材（png/webp/ico）本來就充滿控制位元組 */
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".css",
  ".md",
  ".svg",
  ".html",
  ".txt",
  ".yml",
  ".yaml",
]);
const SKIP_DIRS = new Set(["node_modules", ".next", "out", ".git", ".wrangler"]);

/* Tab / LF / CR 是合法的排版字元；其餘 C0 控制字元與 DEL 都不該出現在原始碼裡 */
const ALLOWED_CONTROL_BYTES = new Set([0x09, 0x0a, 0x0d]);
const isForbidden = (byte: number) => (byte < 0x20 && !ALLOWED_CONTROL_BYTES.has(byte)) || byte === 0x7f;

function textFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) textFiles(path, acc);
    else if (TEXT_EXTENSIONS.has(extname(name))) acc.push(path);
  }
  return acc;
}

describe("原始碼衛生", () => {
  it("沒有任何文字檔含 raw control byte（會讓 grep 靜默跳過整個檔案）", () => {
    const offenders: string[] = [];
    const files = textFiles(ROOT);

    for (const file of files) {
      const buffer = readFileSync(file);
      for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        if (!isForbidden(byte)) continue;
        // 回報行號，讓失敗訊息可以直接跳過去修
        const line = buffer.subarray(0, i).toString("utf8").split("\n").length;
        offenders.push(
          `${relative(ROOT, file)}:${line} 含 0x${byte.toString(16).padStart(2, "0")}`,
        );
        break; // 同一個檔案報第一個就夠
      }
    }

    expect(offenders).toEqual([]);
    // 掃到 0 個檔案代表 glob 壞了，會讓這條斷言變成永遠通過的空殼
    expect(files.length).toBeGreaterThan(20);
  });
});
