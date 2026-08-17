/**
 * @vitest-environment-options { "url": "https://ntutbox.com/" }
 *
 * 預設 host 設成 production 網域，才能驗到 Domain=.ntutbox.com + Secure 的 cookie 寫入路徑。
 * 非 allowlist host 的行為在 analytics.preview-host.test.ts（另一個 jsdom URL）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_COOKIE_NAME,
  analyticsCookieNames,
  canLoadAnalytics,
  clearAnalyticsCookies,
  consentCookieString,
  grantConsent,
  grantedBootstrapScript,
  gtagSrc,
  isAllowedHost,
  isSendable,
  measurementId,
  parseConsentCookie,
  revokeConsent,
  sanitizeClickId,
  sanitizeEventParams,
  sanitizeLocation,
  sanitizeReferrer,
  sanitizeUtmValue,
  sendPageView,
  trackEvent,
} from "./analytics";

const VALID_ID = "G-TEST123456";

function enableEnv(extra: Record<string, string> = {}) {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", VALID_ID);
  vi.stubEnv("NEXT_PUBLIC_GA_ENABLED", "true");
  for (const [key, value] of Object.entries(extra)) vi.stubEnv(key, value);
}

function wipeCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name) continue;
    document.cookie = `${name}=; Path=/; Max-Age=0`;
    document.cookie = `${name}=; Path=/; Max-Age=0; Domain=.ntutbox.com`;
  }
}

/** 攔下 gtag 呼叫；回傳收到的 [command, name, params] 陣列。 */
function stubGtag(impl?: (...args: unknown[]) => void) {
  const calls: unknown[][] = [];
  window.gtag = (...args: unknown[]) => {
    calls.push(args);
    impl?.(...args);
  };
  return calls;
}

beforeEach(() => {
  wipeCookies();
  delete window.gtag;
  delete window.dataLayer;
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("env gating", () => {
  it("未設 env 時視為未啟用（全站 no-op）", () => {
    expect(measurementId()).toBe("");
    expect(canLoadAnalytics("ntutbox.com")).toBe(false);
  });

  it("Measurement ID 格式不合就當沒設，不會半啟用", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "UA-123456-1");
    vi.stubEnv("NEXT_PUBLIC_GA_ENABLED", "true");
    expect(measurementId()).toBe("");
    expect(canLoadAnalytics("ntutbox.com")).toBe(false);
  });

  it("只給 ID 但沒開 ENABLED 也不啟用", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", VALID_ID);
    expect(canLoadAnalytics("ntutbox.com")).toBe(false);
  });

  it("ID + ENABLED 且 host 合法才啟用", () => {
    enableEnv();
    expect(canLoadAnalytics("ntutbox.com")).toBe(true);
  });
});

describe("hostname allowlist", () => {
  it("只放行三個 production host", () => {
    expect(isAllowedHost("ntutbox.com")).toBe(true);
    expect(isAllowedHost("www.ntutbox.com")).toBe(true);
    expect(isAllowedHost("course.ntutbox.com")).toBe(true);
    expect(isAllowedHost("NTUTBOX.COM")).toBe(true);
  });

  it("localhost、workers.dev preview、相似網域都不放行", () => {
    for (const host of [
      "localhost",
      "127.0.0.1",
      "ntutbox-website-preview.workers.dev",
      "ntutbox.com.evil.test",
      "status.ntutbox.com",
    ]) {
      expect(isAllowedHost(host)).toBe(false);
    }
  });

  it("非 allowlist host 即使啟用 env 也不載入", () => {
    enableEnv();
    expect(canLoadAnalytics("localhost")).toBe(false);
  });

  it("NEXT_PUBLIC_GA_DEBUG=true 才放行本機（供 DebugView 用）", () => {
    enableEnv({ NEXT_PUBLIC_GA_DEBUG: "true" });
    expect(canLoadAnalytics("localhost")).toBe(true);
  });
});

describe("consent cookie 契約", () => {
  it("只認 granted_v1 / denied_v1", () => {
    expect(parseConsentCookie("ntutbox_analytics_consent=granted_v1")).toBe("granted");
    expect(parseConsentCookie("ntutbox_analytics_consent=denied_v1")).toBe("denied");
  });

  it("版本不符或值不明 → null（= 重新徵詢，不猜使用者的意思）", () => {
    expect(parseConsentCookie("ntutbox_analytics_consent=granted_v2")).toBeNull();
    expect(parseConsentCookie("ntutbox_analytics_consent=granted")).toBeNull();
    expect(parseConsentCookie("ntutbox_analytics_consent=")).toBeNull();
    expect(parseConsentCookie("")).toBeNull();
  });

  it("能從一串混雜 cookie 中挑出自己那條，且不被前綴相同的名字騙到", () => {
    expect(
      parseConsentCookie("_ga=GA1.1.x; ntutbox_analytics_consent=granted_v1; foo=bar"),
    ).toBe("granted");
    expect(parseConsentCookie("x_ntutbox_analytics_consent=granted_v1")).toBeNull();
  });

  it("ntutbox.com 底下寫 Domain=.ntutbox.com + Secure（兩站共用）", () => {
    const str = consentCookieString("granted", "course.ntutbox.com");
    expect(str).toContain("ntutbox_analytics_consent=granted_v1");
    expect(str).toContain("Domain=.ntutbox.com");
    expect(str).toContain("Path=/");
    expect(str).toContain("Max-Age=15552000");
    expect(str).toContain("SameSite=Lax");
    expect(str).toContain("Secure");
  });

  it("localhost 退化成 host-only 且不帶 Secure（http 下才寫得進去）", () => {
    const str = consentCookieString("denied", "localhost");
    expect(str).toContain("ntutbox_analytics_consent=denied_v1");
    expect(str).not.toContain("Domain=");
    expect(str).not.toContain("Secure");
    expect(str).toContain("SameSite=Lax");
  });

  it("analyticsCookieNames 只挑 GA 與 consent 的 cookie，不動別人的", () => {
    const names = analyticsCookieNames(
      "_ga=1; _ga_ABC123=2; _gcl_au=3; ntutbox_analytics_consent=granted_v1; theme=dark; _gawk=4",
    );
    expect(names.sort()).toEqual(
      ["_ga", "_ga_ABC123", "_gcl_au", "ntutbox_analytics_consent"].sort(),
    );
    expect(names).not.toContain("theme");
  });
});

describe("同意與撤回", () => {
  it("grant 寫入 granted_v1，事件才送得出去", () => {
    enableEnv();
    stubGtag();
    expect(isSendable()).toBe(false);
    grantConsent();
    expect(document.cookie).toContain(`${CONSENT_COOKIE_NAME}=granted_v1`);
    expect(isSendable()).toBe(true);
  });

  it("撤回：consent update denied、清掉 GA cookie、留下 denied_v1 不再追問", () => {
    enableEnv();
    const calls = stubGtag();
    grantConsent();
    document.cookie = "_ga=GA1.1.123.456; Path=/";
    document.cookie = "_ga_TEST=GS1.1.789; Path=/";
    document.cookie = "theme=dark; Path=/";

    const leftovers = revokeConsent();

    expect(calls[0]?.[0]).toBe("consent");
    expect(calls[0]?.[1]).toBe("update");
    expect(calls[0]?.[2]).toMatchObject({
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    expect(document.cookie).not.toContain("_ga=");
    expect(document.cookie).not.toContain("_ga_TEST=");
    expect(document.cookie).toContain("theme=dark");
    expect(document.cookie).toContain(`${CONSENT_COOKIE_NAME}=denied_v1`);
    expect(leftovers).toEqual([]);
  });

  it("撤回後不再送任何事件", () => {
    enableEnv();
    grantConsent();
    const calls = stubGtag();
    revokeConsent();
    calls.length = 0;
    trackEvent("app_store_click", { placement: "hero" });
    expect(calls).toEqual([]);
  });

  it("clearAnalyticsCookies 誠實回報刪不掉的 cookie", () => {
    // 刪除失敗的情境用 setter 攔截模擬：真實世界的對應是別的 Domain 或 HttpOnly
    document.cookie = "_ga=GA1.1.1; Path=/";
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => "_ga=GA1.1.1",
      set: () => {},
    });
    try {
      expect(clearAnalyticsCookies()).toEqual(["_ga"]);
    } finally {
      delete (document as unknown as { cookie?: unknown }).cookie;
      if (descriptor) Object.defineProperty(Document.prototype, "cookie", descriptor);
    }
  });
});

describe("URL sanitizer", () => {
  it("移除 plan / course / payload / token / code 與所有未知參數", () => {
    const result = sanitizeLocation(
      "https://course.ntutbox.com/?plan=360744.360745&course=360744&payload=abc&token=t&code=c&whatever=1",
    );
    expect(result).toEqual({
      page_location: "https://course.ntutbox.com/",
      page_path: "/",
    });
  });

  it("永遠移除 hash", () => {
    const result = sanitizeLocation("https://ntutbox.com/privacy/#analytics");
    expect(result?.page_location).toBe("https://ntutbox.com/privacy/");
    expect(result?.page_path).toBe("/privacy/");
  });

  it("保留 UTM 與 Google click ID，且輸出順序固定", () => {
    const result = sanitizeLocation(
      "https://course.ntutbox.com/?gclid=abc123&utm_medium=cpc&utm_source=google&utm_campaign=1151_adddrop",
    );
    expect(result?.page_location).toBe(
      "https://course.ntutbox.com/?utm_source=google&utm_medium=cpc&utm_campaign=1151_adddrop&gclid=abc123",
    );
    expect(result?.page_path).toBe(
      "/?utm_source=google&utm_medium=cpc&utm_campaign=1151_adddrop&gclid=abc123",
    );
  });

  it("term 不留在 URL；合法才轉成 term_key", () => {
    expect(sanitizeLocation("https://course.ntutbox.com/?term=115-1")).toEqual({
      page_location: "https://course.ntutbox.com/",
      page_path: "/",
      term_key: "115-1",
    });
    expect(sanitizeLocation("https://course.ntutbox.com/?term=115-3")?.term_key).toBeUndefined();
    expect(sanitizeLocation("https://course.ntutbox.com/?term=abc")?.term_key).toBeUndefined();
  });

  it("非 http(s) 或無法解析的網址一律不送", () => {
    expect(sanitizeLocation("not a url")).toBeNull();
    expect(sanitizeLocation("javascript:alert(1)")).toBeNull();
    expect(sanitizeLocation("ntutbox://plan/abc")).toBeNull();
  });

  it("參照頁只留 origin + pathname", () => {
    expect(sanitizeReferrer("https://www.google.com/search?q=%E5%8C%97%E7%A7%91%E9%81%B8%E8%AA%B2")).toBe(
      "https://www.google.com/search",
    );
    expect(sanitizeReferrer("https://ntutbox.com/?plan=x#y")).toBe("https://ntutbox.com/");
    expect(sanitizeReferrer("")).toBe("");
    expect(sanitizeReferrer("garbage")).toBe("");
  });
});

describe("UTM / click ID allowlist 的字元集與長度", () => {
  it("UTM 去控制字元後保留，超過 128 字元整條丟棄（不截斷）", () => {
    expect(sanitizeUtmValue("google")).toBe("google");
    // 控制字元用 fromCharCode 組。**原始程式碼不得出現 raw control byte**：
    // 審查時曾因此被 grep 整檔判成 binary 而靜默跳過（由 no-control-bytes.test.ts 把關）。
    const NUL = String.fromCharCode(0);
    const UNIT_SEP = String.fromCharCode(0x1f);
    const DEL = String.fromCharCode(0x7f);
    expect(sanitizeUtmValue(`goo${NUL}gle`)).toBe("google");
    expect(sanitizeUtmValue(`goo${UNIT_SEP}gle`)).toBe("google");
    expect(sanitizeUtmValue(`goo${DEL}gle`)).toBe("google");
    expect(sanitizeUtmValue("a".repeat(128))).toBe("a".repeat(128));
    expect(sanitizeUtmValue("a".repeat(129))).toBeNull();
    expect(sanitizeUtmValue("")).toBeNull();
  });

  it("click ID 只收 [A-Za-z0-9._~-] 且 ≤512 字元", () => {
    expect(sanitizeClickId("Cj0KCQ.abc-_~1")).toBe("Cj0KCQ.abc-_~1");
    expect(sanitizeClickId("has space")).toBeNull();
    expect(sanitizeClickId("has/slash")).toBeNull();
    expect(sanitizeClickId("a".repeat(512))).toBe("a".repeat(512));
    expect(sanitizeClickId("a".repeat(513))).toBeNull();
  });

  it("不合規的 UTM/click ID 會從 URL 中消失，其餘照留", () => {
    const result = sanitizeLocation(
      `https://ntutbox.com/?utm_source=google&utm_term=${"x".repeat(200)}&gclid=bad%20id`,
    );
    expect(result?.page_location).toBe("https://ntutbox.com/?utm_source=google");
  });
});

describe("事件參數 runtime allowlist", () => {
  it("丟棄未知 key 與敏感 key", () => {
    const out = sanitizeEventParams({
      site_surface: "website",
      placement: "hero",
      plan: "360744.360745",
      course: "360744",
      payload: "abc",
      token: "t",
      code: "c",
      query: "微積分",
      student_id: "111000000",
      page_location: "https://ntutbox.com/",
      totally_new_key: "x",
    });
    expect(out).toEqual({
      site_surface: "website",
      placement: "hero",
      page_location: "https://ntutbox.com/",
    });
  });

  it("enum / 格式不合的值也丟棄", () => {
    expect(sanitizeEventParams({ placement: "somewhere_else" })).toEqual({});
    expect(sanitizeEventParams({ term_key: "115-3" })).toEqual({});
    expect(sanitizeEventParams({ term_key: "115-1" })).toEqual({ term_key: "115-1" });
    expect(sanitizeEventParams({ campaign_key: "made_up" })).toEqual({});
    expect(sanitizeEventParams({ campaign_key: "google_ads_1151" })).toEqual({
      campaign_key: "google_ads_1151",
    });
  });

  it("非字串與空字串一律丟棄（避免送出 undefined/物件）", () => {
    expect(
      sanitizeEventParams({ placement: "", page_title: 123, page_path: null, term_key: undefined }),
    ).toEqual({});
  });

  it("型別層就擋掉敏感 key", () => {
    // @ts-expect-error plan 不是合法事件參數
    trackEvent("app_store_click", { placement: "hero", plan: "360744" });
    // @ts-expect-error placement 必須是 app_store_click 的 enum
    trackEvent("app_store_click", { placement: "ecosystem" });
  });
});

describe("trackEvent 的 no-op 條件", () => {
  it("env 未設 → 不送", () => {
    const calls = stubGtag();
    grantConsent();
    trackEvent("app_store_click", { placement: "hero" });
    expect(calls).toEqual([]);
  });

  it("未同意 → 不送", () => {
    enableEnv();
    const calls = stubGtag();
    trackEvent("app_store_click", { placement: "hero" });
    expect(calls).toEqual([]);
  });

  it("cookie 版本不符 → 視同未同意，不送", () => {
    enableEnv();
    const calls = stubGtag();
    document.cookie = `${CONSENT_COOKIE_NAME}=granted_v0; Path=/`;
    trackEvent("app_store_click", { placement: "hero" });
    expect(calls).toEqual([]);
  });

  it("window.gtag 不存在 → 不送也不炸", () => {
    enableEnv();
    grantConsent();
    expect(() => trackEvent("app_store_click", { placement: "hero" })).not.toThrow();
  });

  it("條件齊備 → 送出，且自動帶上 site_surface", () => {
    enableEnv();
    grantConsent();
    const calls = stubGtag();
    trackEvent("course_system_click", { placement: "ecosystem" });
    expect(calls).toEqual([
      ["event", "course_system_click", { site_surface: "website", placement: "ecosystem" }],
    ]);
  });
});

describe("導頁前送出（event_callback + 150ms 上限）", () => {
  it("不能送時立刻放行，不讓分析卡住導頁", () => {
    const onSent = vi.fn();
    trackEvent("app_store_click", { placement: "hero" }, { onSent });
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("gtag 回呼就立刻放行", () => {
    enableEnv();
    grantConsent();
    stubGtag((...args) => {
      const params = args[2] as { event_callback?: () => void };
      params.event_callback?.();
    });
    const onSent = vi.fn();
    trackEvent("app_store_click", { placement: "hero" }, { onSent });
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("gtag 沒回呼也最多等 150ms", () => {
    vi.useFakeTimers();
    enableEnv();
    grantConsent();
    stubGtag();
    const onSent = vi.fn();
    trackEvent("app_store_click", { placement: "hero" }, { onSent });
    expect(onSent).not.toHaveBeenCalled();
    vi.advanceTimersByTime(149);
    expect(onSent).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("回呼與逾時只會放行一次", () => {
    vi.useFakeTimers();
    enableEnv();
    grantConsent();
    stubGtag((...args) => {
      (args[2] as { event_callback?: () => void }).event_callback?.();
    });
    const onSent = vi.fn();
    trackEvent("app_store_click", { placement: "hero" }, { onSent });
    vi.advanceTimersByTime(500);
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it("gtag 自己爆掉也照樣放行（分析不得擋住下載）", () => {
    enableEnv();
    grantConsent();
    window.gtag = () => {
      throw new Error("gtag exploded");
    };
    const onSent = vi.fn();
    expect(() =>
      trackEvent("app_store_click", { placement: "hero" }, { onSent }),
    ).not.toThrow();
    expect(onSent).toHaveBeenCalledTimes(1);
  });
});

describe("sendPageView", () => {
  it("送出清洗後的網址、term_key 與只剩 origin+pathname 的 referrer", () => {
    enableEnv();
    grantConsent();
    const calls = stubGtag();
    window.history.replaceState(
      {},
      "",
      "/?term=115-1&plan=360744.360745&payload=zzz&utm_source=google#section",
    );
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://www.google.com/search?q=secret",
    });

    sendPageView();

    expect(calls).toHaveLength(1);
    const [command, name, params] = calls[0] as [string, string, Record<string, string>];
    expect(command).toBe("event");
    expect(name).toBe("page_view");
    expect(params.page_location).toBe("https://ntutbox.com/?utm_source=google");
    expect(params.page_path).toBe("/?utm_source=google");
    expect(params.term_key).toBe("115-1");
    expect(params.page_referrer).toBe("https://www.google.com/search");
    expect(JSON.stringify(params)).not.toContain("360744");
    expect(JSON.stringify(params)).not.toContain("zzz");
    expect(JSON.stringify(params)).not.toContain("secret");
  });
});

describe("inline bootstrap script", () => {
  it("同意後的 bootstrap 依序宣告 consent、js、config", () => {
    const src = grantedBootstrapScript(VALID_ID);
    const order = [
      src.indexOf("'consent','default'"),
      src.indexOf("'consent','update'"),
      src.indexOf("gtag('js'"),
      src.indexOf("gtag('config'"),
    ];
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("預設四項全 denied；同意後 ad_personalization 仍維持 denied（不做個人化）", () => {
    const src = grantedBootstrapScript(VALID_ID);
    const defaultArg = src.slice(src.indexOf("'consent','default'"), src.indexOf("'consent','update'"));
    expect(defaultArg).toContain('"analytics_storage":"denied"');
    expect(defaultArg).toContain('"ad_storage":"denied"');
    const updateArg = src.slice(src.indexOf("'consent','update'"), src.indexOf("gtag('js'"));
    expect(updateArg).toContain('"analytics_storage":"granted"');
    expect(updateArg).toContain('"ad_storage":"granted"');
    expect(updateArg).toContain('"ad_user_data":"granted"');
    expect(updateArg).toContain('"ad_personalization":"denied"');
  });

  it("config 關掉自動 page_view 並用 cookie_domain auto（兩站共用 session）", () => {
    const src = grantedBootstrapScript(VALID_ID);
    expect(src).toContain('"send_page_view":false');
    expect(src).toContain('"cookie_domain":"auto"');
  });

  it("bootstrap 自身不含任何外部網址（同意前後都不會由它發請求）", () => {
    const src = grantedBootstrapScript(VALID_ID);
    expect(src).not.toContain("googletagmanager");
    expect(src).not.toContain("google-analytics");
    expect(src).not.toContain("</script");
  });

  it("debug 模式才加 debug_mode", () => {
    expect(grantedBootstrapScript(VALID_ID)).not.toContain("debug_mode");
    vi.stubEnv("NEXT_PUBLIC_GA_DEBUG", "true");
    expect(grantedBootstrapScript(VALID_ID)).toContain('"debug_mode":true');
  });

  it("ID 不合法就產不出 script（守住 inline 注入）", () => {
    expect(grantedBootstrapScript("")).toBe("");
    expect(grantedBootstrapScript("G-x';alert(1);//")).toBe("");
  });

  it("gtagSrc 指向 gtag.js 並帶上 ID", () => {
    expect(gtagSrc(VALID_ID)).toBe(
      `https://www.googletagmanager.com/gtag/js?id=${VALID_ID}`,
    );
  });
});
