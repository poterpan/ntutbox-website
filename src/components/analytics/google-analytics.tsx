"use client";

/* 唯一會載入 Google 資源的地方。只有 AnalyticsProvider 在 consent === "granted" 時才 render 它，
 * 所以「同意前零 Google 請求」是由 render 條件保證的，不是由 script 內部判斷。
 *
 * 兩個 <Script> 的順序即執行順序：inline bootstrap 先建立 dataLayer 並把
 * consent default/update + js + config 排進 queue，gtag.js 之後才載入並照序消化。
 * 因此不依賴網路時序，也不會出現「gtag.js 先跑、consent 尚未宣告」的空窗。
 */

import Script from "next/script";
import { grantedBootstrapScript, gtagSrc, measurementId } from "@/lib/analytics";

export function GoogleAnalytics() {
  const id = measurementId();
  const bootstrap = grantedBootstrapScript(id);
  if (!id || !bootstrap) return null;

  return (
    <>
      {/* inline script 一定要給 id，Next 才能追蹤與去重（next/script 文件明載） */}
      <Script id="ntutbox-ga-bootstrap" strategy="afterInteractive">
        {bootstrap}
      </Script>
      <Script id="ntutbox-ga-loader" src={gtagSrc(id)} strategy="afterInteractive" />
    </>
  );
}
