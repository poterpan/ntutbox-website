/* GA4 + Consent Mode v2 的唯一進出口。規格：docs/marketing/2026-08-17-ga4-google-ads-handoff.md
 *
 * 三條不可退讓的性質：
 * 1. **同意前零 Google 網路請求**：本檔只算字串與讀 cookie，載入 gtag.js 的責任在
 *    components/analytics/google-analytics.tsx，而它只在 consent === "granted" 時被 render。
 * 2. **失敗不外溢**：任何送出路徑都不得 throw；分析壞掉不能影響下載鍵、導頁或任何產品行為。
 * 3. **URL 白名單制**：page_location / page_path / page_referrer 一律經 sanitizeLocation /
 *    sanitizeReferrer；未列名的 query 一律移除（含 plan / course / payload / token / code）。
 *
 * ntutbox-course/apps/web 有一份行為相同的實作。**consent cookie 契約必須逐字一致**，
 * 兩站才能共用同意狀態（同屬 .ntutbox.com）。改契約要同時改兩邊。
 */

// ── build-time env ────────────────────────────────────────────────
// Next 只替換「process.env.NEXT_PUBLIC_X」這個字面；不要改成動態 key 或先解構，
// 否則靜態 export 後會變成 undefined。

/** 合法 Measurement ID 才回傳，否則回空字串（= 未設定 → 全站 no-op）。 */
export function measurementId(): string {
  const raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
  return /^G-[A-Z0-9]{4,20}$/.test(raw) ? raw : "";
}

/** 需同時給 NEXT_PUBLIC_GA_ENABLED=true 與合法 Measurement ID，才視為啟用。 */
export function analyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GA_ENABLED === "true" && measurementId() !== "";
}

/** DebugView 用：放行 hostname allowlist 並加 debug_mode。務必搭配「測試用」的 stream。 */
export function debugMode(): boolean {
  return process.env.NEXT_PUBLIC_GA_DEBUG === "true";
}

// ── hostname allowlist ────────────────────────────────────────────
// localhost 與 *.workers.dev preview 預設不送 production GA（規格 §2）。

export const PRODUCTION_HOSTS = [
  "ntutbox.com",
  "www.ntutbox.com",
  "course.ntutbox.com",
] as const;

export function isAllowedHost(hostname: string): boolean {
  return (PRODUCTION_HOSTS as readonly string[]).includes(hostname.toLowerCase());
}

/** env 啟用 + hostname 在 allowlist（或明確開 debug）才可載入 / 送出。 */
export function canLoadAnalytics(hostname: string): boolean {
  if (!analyticsEnabled()) return false;
  return isAllowedHost(hostname) || debugMode();
}

// ── consent cookie 契約（與 ntutbox-course 逐字相同）────────────────

export const CONSENT_COOKIE_NAME = "ntutbox_analytics_consent";
export const CONSENT_GRANTED_VALUE = "granted_v1";
export const CONSENT_DENIED_VALUE = "denied_v1";
export const CONSENT_MAX_AGE_SECONDS = 15552000; // 180 天
export const CONSENT_COOKIE_DOMAIN = ".ntutbox.com";

export type ConsentState = "granted" | "denied";

/** GA 自己寫的 cookie（撤回時要清）。_ga_<STREAM>、_gcl_au 等前綴式命名。 */
const GA_COOKIE_PATTERNS = [/^_ga$/, /^_ga_/, /^_gcl/];

/**
 * 只認 granted_v1 / denied_v1。其他值（含舊版 granted_v0、被截斷、人工亂改）
 * 一律回 null = 「沒問過」→ 重新顯示同意 UI。版本升級靠改 VALUE 常數即可重新徵詢。
 */
export function parseConsentCookie(cookieString: string): ConsentState | null {
  for (const part of cookieString.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== CONSENT_COOKIE_NAME) continue;
    const value = part.slice(eq + 1).trim();
    if (value === CONSENT_GRANTED_VALUE) return "granted";
    if (value === CONSENT_DENIED_VALUE) return "denied";
    return null;
  }
  return null;
}

function isNtutboxHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "ntutbox.com" || host.endsWith(".ntutbox.com");
}

/**
 * 要寫進 document.cookie 的字串。
 * ntutbox.com 底下用 Domain=.ntutbox.com + Secure，讓官網與排課站共用同意狀態；
 * 其他 host（localhost 開發）退化成 host-only 且不帶 Secure，否則 http 下寫不進去。
 */
export function consentCookieString(state: ConsentState, hostname: string): string {
  const value = state === "granted" ? CONSENT_GRANTED_VALUE : CONSENT_DENIED_VALUE;
  const parts = [
    `${CONSENT_COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ];
  if (isNtutboxHost(hostname)) {
    parts.splice(1, 0, `Domain=${CONSENT_COOKIE_DOMAIN}`);
    parts.push("Secure");
  }
  return parts.join("; ");
}

/** 刪除用字串：同名 cookie 可能寫在 host-only 或 .ntutbox.com 上，兩種 Domain 都要試。 */
export function cookieDeletionStrings(name: string, hostname: string): string[] {
  const base = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  const out = [base];
  if (isNtutboxHost(hostname)) {
    out.push(`${base}; Domain=${CONSENT_COOKIE_DOMAIN}`);
    out.push(`${base}; Domain=${hostname}`);
  }
  return out;
}

/** document.cookie 裡我們該清掉的 cookie 名（GA 的 + consent 本身）。 */
export function analyticsCookieNames(cookieString: string): string[] {
  const names = new Set<string>();
  for (const part of cookieString.split(";")) {
    const eq = part.indexOf("=");
    const name = (eq < 0 ? part : part.slice(0, eq)).trim();
    if (!name) continue;
    if (name === CONSENT_COOKIE_NAME || GA_COOKIE_PATTERNS.some((re) => re.test(name))) {
      names.add(name);
    }
  }
  return [...names];
}

export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  return parseConsentCookie(document.cookie);
}

export function writeConsent(state: ConsentState): void {
  if (typeof document === "undefined") return;
  document.cookie = consentCookieString(state, window.location.hostname);
}

/**
 * 清掉前端看得到的分析 cookie（_ga、_ga_*、_gcl_* 與 consent 本身），
 * 並**回傳仍然存在的名字**。HttpOnly 或別的 Domain 寫的 cookie 前端刪不掉——
 * 回傳值讓 UI 照實說，不假裝已刪（規格 §4）。
 */
export function clearAnalyticsCookies(): string[] {
  if (typeof document === "undefined") return [];
  const hostname = window.location.hostname;
  for (const name of analyticsCookieNames(document.cookie)) {
    for (const str of cookieDeletionStrings(name, hostname)) document.cookie = str;
  }
  return analyticsCookieNames(document.cookie);
}

export function grantConsent(): void {
  writeConsent("granted");
}

/**
 * 撤回／拒絕。順序有意義：
 * 1. 先 consent update denied——此時 cookie 還在 granted，gtag 一定收得到這道指令；
 * 2. 清掉所有分析 cookie，含舊的 consent cookie（可能存在 host-only 與 .ntutbox.com 兩份，
 *    留著會遮蔽正確的那一份）；
 * 3. 重新寫入 denied_v1，記住這個決定，避免下次造訪又跳同意 UI。
 *
 * 註：規格 §4 同時要求「刪除 consent cookie」與「拒絕後維持不載入」，兩者互斥；
 * 這裡採「刪掉舊紀錄後寫入 denied_v1」——刪除確實發生，且尊重使用者的拒絕不再追問。
 */
export function revokeConsent(): string[] {
  updateConsentDenied();
  const leftovers = clearAnalyticsCookies();
  writeConsent("denied");
  return leftovers;
}

// ── URL / referrer 清洗（規格 §6）──────────────────────────────────

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;

const UTM_MAX_LENGTH = 128;
const CLICK_ID_MAX_LENGTH = 512;
const CLICK_ID_PATTERN = /^[A-Za-z0-9._~-]+$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f-\u009f]/g;

export const TERM_KEY_PATTERN = /^\d{3}-[12]$/;

/** 去控制字元後超過 128 字元就整條丟棄——不截斷後勉強使用（規格 §6）。 */
export function sanitizeUtmValue(raw: string): string | null {
  const cleaned = raw.replace(CONTROL_CHARS, "");
  if (cleaned === "" || cleaned.length > UTM_MAX_LENGTH) return null;
  return cleaned;
}

/** click ID 只收 [A-Za-z0-9._~-] 且 ≤512 字元，違反就丟棄。 */
export function sanitizeClickId(raw: string): string | null {
  if (raw === "" || raw.length > CLICK_ID_MAX_LENGTH) return null;
  return CLICK_ID_PATTERN.test(raw) ? raw : null;
}

export type SanitizedLocation = {
  page_location: string;
  page_path: string;
  term_key?: string;
};

/**
 * 白名單制：只留 utm_* 與 Google click ID，其餘 query（plan / course / payload /
 * token / code 與任何未知參數）全部移除，hash 永遠移除。
 * `term` 不留在 URL，符合 ^\d{3}-[12]$ 才轉成事件參數 term_key。
 * 輸出 query 依固定 key 順序產生，與輸入順序無關（可測、可比對）。
 */
export function sanitizeLocation(href: string): SanitizedLocation | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const term = url.searchParams.get("term");
  const termKey = term !== null && TERM_KEY_PATTERN.test(term) ? term : undefined;

  const kept = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const raw = url.searchParams.get(key);
    if (raw === null) continue;
    const value = sanitizeUtmValue(raw);
    if (value !== null) kept.set(key, value);
  }
  for (const key of CLICK_ID_KEYS) {
    const raw = url.searchParams.get(key);
    if (raw === null) continue;
    const value = sanitizeClickId(raw);
    if (value !== null) kept.set(key, value);
  }

  const query = kept.toString();
  url.search = query;
  url.hash = "";

  return {
    page_location: url.toString(),
    page_path: query ? `${url.pathname}?${query}` : url.pathname,
    ...(termKey ? { term_key: termKey } : {}),
  };
}

/** 參照頁只留 origin + pathname；query/hash 全丟（可能夾帶他站的個資）。 */
export function sanitizeReferrer(raw: string): string {
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return `${url.origin}${url.pathname}`;
  } catch {
    return "";
  }
}

// ── 事件契約（規格 §7；本 repo 只有這三種事件）──────────────────────

export const SITE_SURFACE = "website";

export const APP_STORE_PLACEMENTS = ["hero", "header", "guest_cta", "plan"] as const;
export const COURSE_SYSTEM_PLACEMENTS = ["header", "ecosystem"] as const;
/** 固定 enum；禁止把使用者輸入或原始 gclid 當 campaign_key。 */
export const CAMPAIGN_KEYS = ["google_ads_1151"] as const;

export type AppStorePlacement = (typeof APP_STORE_PLACEMENTS)[number];
export type CourseSystemPlacement = (typeof COURSE_SYSTEM_PLACEMENTS)[number];
export type CampaignKey = (typeof CAMPAIGN_KEYS)[number];

export type EventParams = {
  page_view: SanitizedLocation & { page_referrer?: string; page_title?: string };
  app_store_click: { placement: AppStorePlacement };
  course_system_click: { placement: CourseSystemPlacement };
};

export type EventName = keyof EventParams;

/**
 * 型別層擋掉敏感 key：即使呼叫端傳的是變數（不觸發 excess property check），
 * 帶到這些欄位仍會編譯失敗。runtime 另有 allowlist 再擋一次。
 */
export type BlockedParamKey =
  | "plan"
  | "course"
  | "payload"
  | "token"
  | "code"
  | "query"
  | "q"
  | "search"
  | "keyword"
  | "student_id"
  | "offering_id"
  | "course_code"
  | "teacher"
  | "email"
  | "name"
  | "user_id"
  | "gclid"
  | "url";

type WithoutBlockedKeys<T> = T & Partial<Record<BlockedParamKey, never>>;

/** runtime allowlist：不在此表的 key 一律丟棄（含未知與敏感 key）。 */
const ALLOWED_PARAM_KEYS = new Set([
  "site_surface",
  "placement",
  "term_key",
  "campaign_key",
  "page_location",
  "page_path",
  "page_referrer",
  "page_title",
]);

const KNOWN_PLACEMENTS: ReadonlySet<string> = new Set<string>([
  ...APP_STORE_PLACEMENTS,
  ...COURSE_SYSTEM_PLACEMENTS,
]);

/**
 * 只放行 allowlist 內、非空字串、且 enum/格式合法的參數。
 * 這是最後一道防線：型別擋不到的地方（any、JSON、未來新程式）由這裡擋。
 */
export function sanitizeEventParams(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!ALLOWED_PARAM_KEYS.has(key)) continue;
    if (typeof value !== "string" || value === "") continue;
    if (key === "term_key" && !TERM_KEY_PATTERN.test(value)) continue;
    if (key === "placement" && !KNOWN_PLACEMENTS.has(value)) continue;
    if (key === "campaign_key" && !(CAMPAIGN_KEYS as readonly string[]).includes(value)) continue;
    out[key] = value;
  }
  return out;
}

// ── gtag 送出 ─────────────────────────────────────────────────────

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFn;
  }
}

/** 每次送出都重讀 cookie：跨 tab 撤回同意後能立刻停止，不靠元件狀態同步。 */
export function isSendable(): boolean {
  if (typeof window === "undefined") return false;
  if (!canLoadAnalytics(window.location.hostname)) return false;
  if (readConsent() !== "granted") return false;
  return typeof window.gtag === "function";
}

export type SendOptions = {
  /** 送出（或逾時）後才執行，用於「導頁前先送出」。無論能不能送，一定會被呼叫一次。 */
  onSent?: () => void;
  /** onSent 的最長等待；預設 150ms，不可為了量測明顯拖慢導頁。 */
  timeoutMs?: number;
};

export function trackEvent<N extends EventName>(
  name: N,
  params: WithoutBlockedKeys<EventParams[N]>,
  options?: SendOptions,
): void {
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    options?.onSent?.();
  };

  if (!isSendable()) {
    settle();
    return;
  }

  const payload = sanitizeEventParams({ site_surface: SITE_SURFACE, ...params });

  try {
    if (options?.onSent) {
      const timer = window.setTimeout(settle, options.timeoutMs ?? 150);
      window.gtag?.("event", name, {
        ...payload,
        event_callback: () => {
          window.clearTimeout(timer);
          settle();
        },
      });
    } else {
      window.gtag?.("event", name, payload);
    }
  } catch {
    // 分析永遠不能擋住產品行為（規格 §12）
    settle();
  }
}

/** 手動 page_view（config 已設 send_page_view:false，規格 §6）。 */
export function sendPageView(): void {
  if (typeof window === "undefined") return;
  const location = sanitizeLocation(window.location.href);
  if (!location) return;
  const referrer = sanitizeReferrer(document.referrer);
  trackEvent("page_view", {
    ...location,
    ...(referrer ? { page_referrer: referrer } : {}),
    ...(document.title ? { page_title: document.title } : {}),
  });
}

// ── Consent Mode v2 ───────────────────────────────────────────────

const CONSENT_DENIED_ALL = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

/** 規格 §4：ad_personalization 即使同意也維持 denied（不做個人化/再行銷）。 */
const CONSENT_GRANTED_SET = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "denied",
  analytics_storage: "granted",
} as const;

/**
 * 同意後才 render 的 inline bootstrap，**不載入任何外部資源**（只建 dataLayer 與排隊）。
 * 順序即 dataLayer 順序：default denied → update granted → js → config。
 * gtag.js 之後才載入並照序消化這個 queue，所以不依賴 script 載入時序。
 */
export function grantedBootstrapScript(id: string): string {
  if (!/^G-[A-Z0-9]{4,20}$/.test(id)) return "";
  const config: Record<string, unknown> = {
    send_page_view: false,
    cookie_domain: "auto",
    cookie_flags: "SameSite=Lax",
  };
  if (debugMode()) config.debug_mode = true;
  return [
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){window.dataLayer.push(arguments);}",
    "window.gtag=gtag;",
    `gtag('consent','default',${JSON.stringify(CONSENT_DENIED_ALL)});`,
    `gtag('consent','update',${JSON.stringify(CONSENT_GRANTED_SET)});`,
    "gtag('js',new Date());",
    `gtag('config',${JSON.stringify(id)},${JSON.stringify(config)});`,
  ].join("");
}

export function gtagSrc(id: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
}

/** 撤回同意：gtag.js 已載入無法卸除，至少把 consent 降回 denied。 */
export function updateConsentDenied(): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("consent", "update", CONSENT_DENIED_ALL);
  } catch {
    // 同上：撤回流程不得因 gtag 異常中斷
  }
}
