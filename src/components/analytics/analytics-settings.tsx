"use client";

/* 隱私頁的「分析設定」控制區（規格 §4：需提供可撤回同意的入口）。
 * 段落標題與說明文字由隱私頁 server-render，這裡只負責需要 cookie 才能決定的互動部分——
 * 靜態 export 的 HTML 裡因此不含任何「目前狀態」，不會出現與實際 cookie 不符的畫面。
 */

import { ANALYTICS_SETTINGS } from "@/content/site";
import {
  consentButtonClass,
  useAnalyticsConsent,
} from "@/components/analytics/analytics-consent";

export function AnalyticsSettings() {
  const { ready, available, consent, grant, revoke, leftoverCookies } =
    useAnalyticsConsent();

  if (!ready) {
    return <p className="mt-2 text-[var(--ink-faint)]">{ANALYTICS_SETTINGS.loading}</p>;
  }

  if (!available) {
    return <p className="mt-2 text-[var(--ink-faint)]">{ANALYTICS_SETTINGS.unavailable}</p>;
  }

  const stateText =
    consent === "granted"
      ? ANALYTICS_SETTINGS.grantedState
      : consent === "denied"
        ? ANALYTICS_SETTINGS.deniedState
        : ANALYTICS_SETTINGS.unsetState;

  return (
    <div className="mt-2">
      <p>{stateText}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {consent === "granted" ? (
          <button type="button" onClick={revoke} className={consentButtonClass("neutral")}>
            {ANALYTICS_SETTINGS.revoke}
          </button>
        ) : (
          <button type="button" onClick={grant} className={consentButtonClass("accent")}>
            {ANALYTICS_SETTINGS.grant}
          </button>
        )}
      </div>
      {consent === "denied" ? (
        <p className="mt-4 text-[13px] leading-6 text-[var(--ink-faint)]">
          {ANALYTICS_SETTINGS.revokedNote}
        </p>
      ) : null}
      {/* 前端刪不掉的 cookie 照實列出，不宣稱已清除（規格 §4） */}
      {leftoverCookies.length > 0 ? (
        <p className="mt-2 text-[13px] leading-6 text-[var(--ink-faint)]">
          {ANALYTICS_SETTINGS.leftoverNote}
          <code className="ml-1 text-[var(--ink-soft)]">{leftoverCookies.join("、")}</code>
        </p>
      ) : null}
    </div>
  );
}
