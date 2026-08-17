"use client";

/* 最小 client 邊界：全站元件仍是 server component，只有真正需要 onClick 的 <a> 換成這個。
 * 業務元件不直接呼叫 gtag，只宣告「這個連結對應哪個事件」（規格 §5）。
 */

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { trackEvent, type EventParams } from "@/lib/analytics";

/** 本 repo 只有這兩種點擊事件（規格 §7）。 */
export type TrackedClick =
  | { name: "app_store_click"; params: EventParams["app_store_click"] }
  | { name: "course_system_click"; params: EventParams["course_system_click"] };

type TrackedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
  href: string;
  /** 不給就是普通 <a>（例如生態系卡片裡不需追蹤的那張）。 */
  event?: TrackedClick | null;
  children: ReactNode;
};

/** 使用者按了修飾鍵／中鍵 = 自己開新分頁，瀏覽器不會離開本頁，直接送就好。 */
function opensElsewhere(e: MouseEvent<HTMLAnchorElement>): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

export function TrackedLink({ href, event, children, ...rest }: TrackedLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!event) return;
    // 新分頁（或修飾鍵）：本頁不卸載，事件來得及送出，不必攔 default
    if (rest.target === "_blank" || opensElsewhere(e) || e.defaultPrevented) {
      trackEvent(event.name, event.params);
      return;
    }
    // 同分頁導頁：先送再走，但最多等 150ms，不可為了量測拖慢導頁（規格 §7）
    e.preventDefault();
    trackEvent(event.name, event.params, {
      timeoutMs: 150,
      onSent: () => {
        window.location.href = href;
      },
    });
  };

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
