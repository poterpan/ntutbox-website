/**
 * @vitest-environment-options { "url": "https://ntutbox-website-preview.workers.dev/" }
 *
 * Cloudflare preview URL 上的行為：env 設好、使用者也同意了，仍不得送 production GA（規格 §2）。
 * 這需要不同的 jsdom location，所以單獨一個檔案。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { grantConsent, isSendable, trackEvent } from "./analytics";

beforeEach(() => {
  vi.unstubAllEnvs();
  delete window.gtag;
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123456");
  vi.stubEnv("NEXT_PUBLIC_GA_ENABLED", "true");
});

describe("preview host", () => {
  it("即使已同意且 gtag 存在也不送", () => {
    const calls: unknown[][] = [];
    window.gtag = (...args: unknown[]) => calls.push(args);
    grantConsent();
    expect(isSendable()).toBe(false);
    trackEvent("app_store_click", { placement: "hero" });
    expect(calls).toEqual([]);
  });

  it("開了 NEXT_PUBLIC_GA_DEBUG 才會放行（給 DebugView 專用 stream）", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_DEBUG", "true");
    window.gtag = () => {};
    grantConsent();
    expect(isSendable()).toBe(true);
  });
});
