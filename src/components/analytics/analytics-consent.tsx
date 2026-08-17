"use client";

/* Consent 狀態的唯一持有者，並負責決定「要不要載入 GA」。
 *
 * 為什麼一切都在 useEffect 之後才決定：本站是靜態 export，layout 在 build 時就 prerender 成
 * HTML。cookie 與 hostname 只有瀏覽器知道，所以第一次 render（= SSR 產物）必須輸出「什麼都沒有」，
 * 否則 hydration mismatch，而且 out/ 的 HTML 會夾帶 GA 痕跡（check-site 會擋）。
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  canLoadAnalytics,
  grantConsent,
  readConsent,
  revokeConsent,
  sendPageView,
  type ConsentState,
} from "@/lib/analytics";
import { ANALYTICS_CONSENT } from "@/content/site";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { usePathname } from "next/navigation";

type ConsentContextValue = {
  /** 已在瀏覽器解析完 env / hostname / cookie。false 時 UI 不該下任何結論。 */
  ready: boolean;
  /** env 有設且 hostname 允許——只有這樣才會有可調整的設定。 */
  available: boolean;
  /** null = 沒問過或 cookie 版本不符 → 要重新徵詢。 */
  consent: ConsentState | null;
  grant: () => void;
  revoke: () => void;
  /** 撤回後仍存在、前端刪不掉的 cookie 名（照實回報，不假裝已刪）。 */
  leftoverCookies: string[];
};

const ConsentContext = createContext<ConsentContextValue>({
  ready: false,
  available: false,
  consent: null,
  grant: () => {},
  revoke: () => {},
  leftoverCookies: [],
});

export function useAnalyticsConsent(): ConsentContextValue {
  return useContext(ConsentContext);
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [leftoverCookies, setLeftoverCookies] = useState<string[]>([]);

  useEffect(() => {
    setAvailable(canLoadAnalytics(window.location.hostname));
    setConsent(readConsent());
    setReady(true);
  }, []);

  const grant = useCallback(() => {
    grantConsent();
    setLeftoverCookies([]);
    setConsent("granted");
  }, []);

  const revoke = useCallback(() => {
    setLeftoverCookies(revokeConsent());
    setConsent("denied");
  }, []);

  const active = ready && available && consent === "granted";

  return (
    <ConsentContext.Provider
      value={{ ready, available, consent, grant, revoke, leftoverCookies }}
    >
      {children}
      {active ? <GoogleAnalytics /> : null}
      {active ? <PageViewTracker /> : null}
      {ready && available && consent === null ? <ConsentBanner /> : null}
    </ConsentContext.Provider>
  );
}

/**
 * 手動 page_view（config 已 send_page_view:false）。
 * 只依賴 usePathname——刻意不用 useSearchParams：靜態 export 下含 useSearchParams 的元件
 * 必須包 <Suspense> 否則 next build 直接失敗，而本站導覽不靠 query，用不著它。
 * 真正要送的網址在 sendPageView() 內從 window.location 現讀並清洗。
 *
 * ref 去重：同一個 pathname 只送一次。Strict Mode 會刻意跑兩遍 effect
 * （實測 dev 下 DebugView 會收到兩筆 page_view），ref 讓重複那次靜靜跳過。
 */
function PageViewTracker() {
  const pathname = usePathname();
  const lastSentPath = useRef<string | null>(null);
  useEffect(() => {
    if (lastSentPath.current === pathname) return;
    lastSentPath.current = pathname;
    sendPageView();
  }, [pathname]);
  return null;
}

function ConsentBanner() {
  const { grant, revoke } = useAnalyticsConsent();
  return (
    <div
      role="region"
      aria-label={ANALYTICS_CONSENT.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
    >
      <div className="overlay-surface mx-auto max-w-2xl rounded-2xl px-5 py-4">
        <p className="text-[15px] font-semibold text-[var(--ink)]">
          {ANALYTICS_CONSENT.title}
        </p>
        <p className="mt-1.5 text-[13px] leading-6 text-[var(--ink-soft)]">
          {ANALYTICS_CONSENT.body}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* 同尺寸、同字重、同底色——只用文字色區分，避免誘導 */}
          <button type="button" onClick={grant} className={consentButtonClass("accent")}>
            {ANALYTICS_CONSENT.accept}
          </button>
          <button type="button" onClick={revoke} className={consentButtonClass("neutral")}>
            {ANALYTICS_CONSENT.decline}
          </button>
          <Link
            href="/privacy/"
            className="ml-auto text-[13px] text-[var(--ink-faint)] underline underline-offset-4 transition-colors hover:text-[var(--accent-ink)]"
          >
            {ANALYTICS_CONSENT.policyLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 「同意」與「拒絕」共用的按鈕樣式：**同尺寸、同字重、同底色與同邊框**，
 * 只用文字色區分（規格 §4「同等可見、不得誘導」）。邊框走 --ink/18 而非 --glass-border，
 * 因為後者在淺色主題是近白色，疊在玻璃面上等於沒有邊界。
 */
export function consentButtonClass(tone: "accent" | "neutral"): string {
  return [
    "rounded-full border border-[var(--ink)]/18 bg-[var(--glass-bg-strong)]",
    "px-4 py-2 text-sm font-medium transition-colors",
    "hover:bg-[var(--accent)]/12",
    tone === "accent" ? "text-[var(--accent-ink)]" : "text-[var(--ink)]",
  ].join(" ");
}
