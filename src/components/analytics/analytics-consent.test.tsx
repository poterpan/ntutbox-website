/**
 * @vitest-environment-options { "url": "https://ntutbox.com/" }
 */
import { render, screen } from "@testing-library/react";
import { StrictMode, act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsProvider } from "./analytics-consent";
import { AnalyticsSettings } from "./analytics-settings";
import { TrackedLink } from "./tracked-link";
import { CONSENT_COOKIE_NAME } from "@/lib/analytics";
import { ANALYTICS_CONSENT, ANALYTICS_SETTINGS } from "@/content/site";

// next/script 在測試環境沒有 Next runtime；換成看得見的 stub，方便斷言「有沒有載入 GA」
vi.mock("next/script", () => ({
  default: ({ src, children }: { src?: string; children?: React.ReactNode }) => (
    <script data-testid="ga-script" data-src={src ?? ""}>
      {children}
    </script>
  ),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const VALID_ID = "G-TEST123456";

function enableEnv() {
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", VALID_ID);
  vi.stubEnv("NEXT_PUBLIC_GA_ENABLED", "true");
}

function wipeCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name) continue;
    document.cookie = `${name}=; Path=/; Max-Age=0`;
    document.cookie = `${name}=; Path=/; Max-Age=0; Domain=.ntutbox.com`;
  }
}

beforeEach(() => {
  wipeCookies();
  delete window.gtag;
  delete window.dataLayer;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AnalyticsProvider", () => {
  it("env 未設時完全透明：無同意 UI、無 GA script", () => {
    render(
      <AnalyticsProvider>
        <p>content</p>
      </AnalyticsProvider>,
    );
    expect(screen.getByText("content")).toBeInTheDocument();
    expect(screen.queryByText(ANALYTICS_CONSENT.accept)).not.toBeInTheDocument();
    expect(screen.queryByTestId("ga-script")).not.toBeInTheDocument();
  });

  it("啟用且尚未選擇時顯示同意 UI，但同意前不載入任何 Google 資源", () => {
    enableEnv();
    render(
      <AnalyticsProvider>
        <p>content</p>
      </AnalyticsProvider>,
    );
    expect(screen.getByText(ANALYTICS_CONSENT.accept)).toBeInTheDocument();
    expect(screen.getByText(ANALYTICS_CONSENT.decline)).toBeInTheDocument();
    expect(screen.queryByTestId("ga-script")).not.toBeInTheDocument();
  });

  it("同意與拒絕兩顆按鈕同尺寸同字重（不得誘導）", () => {
    enableEnv();
    render(
      <AnalyticsProvider>
        <p>content</p>
      </AnalyticsProvider>,
    );
    const accept = screen.getByText(ANALYTICS_CONSENT.accept);
    const decline = screen.getByText(ANALYTICS_CONSENT.decline);
    const strip = (cls: string) =>
      cls
        .split(/\s+/)
        .filter((c) => !c.startsWith("text-[var("))
        .sort()
        .join(" ");
    expect(strip(accept.className)).toBe(strip(decline.className));
  });

  it("按下同意 → 寫入 granted_v1、載入 gtag.js、同意 UI 收起", async () => {
    enableEnv();
    render(
      <AnalyticsProvider>
        <p>content</p>
      </AnalyticsProvider>,
    );
    await act(async () => {
      screen.getByText(ANALYTICS_CONSENT.accept).click();
    });
    expect(document.cookie).toContain(`${CONSENT_COOKIE_NAME}=granted_v1`);
    expect(screen.queryByText(ANALYTICS_CONSENT.accept)).not.toBeInTheDocument();
    const srcs = screen
      .getAllByTestId("ga-script")
      .map((el) => el.getAttribute("data-src"));
    expect(srcs).toContain(`https://www.googletagmanager.com/gtag/js?id=${VALID_ID}`);
  });

  it("按下拒絕 → 寫入 denied_v1、不載入 GA、重整後不再詢問", async () => {
    enableEnv();
    const { unmount } = render(
      <AnalyticsProvider>
        <p>content</p>
      </AnalyticsProvider>,
    );
    await act(async () => {
      screen.getByText(ANALYTICS_CONSENT.decline).click();
    });
    expect(document.cookie).toContain(`${CONSENT_COOKIE_NAME}=denied_v1`);
    expect(screen.queryByTestId("ga-script")).not.toBeInTheDocument();

    unmount();
    render(
      <AnalyticsProvider>
        <p>content</p>
      </AnalyticsProvider>,
    );
    expect(screen.queryByText(ANALYTICS_CONSENT.accept)).not.toBeInTheDocument();
    expect(screen.queryByTestId("ga-script")).not.toBeInTheDocument();
  });

  it("page_view 只送一次——Strict Mode 的雙跑 effect 不得變成兩筆", () => {
    enableEnv();
    document.cookie = `${CONSENT_COOKIE_NAME}=granted_v1; Path=/`;
    const calls: unknown[][] = [];
    window.gtag = (...args: unknown[]) => calls.push(args);
    render(
      <StrictMode>
        <AnalyticsProvider>
          <p>content</p>
        </AnalyticsProvider>
      </StrictMode>,
    );
    const pageViews = calls.filter((c) => c[0] === "event" && c[1] === "page_view");
    expect(pageViews).toHaveLength(1);
  });

  it("重新 render 同一路徑不會重複送 page_view", () => {
    enableEnv();
    document.cookie = `${CONSENT_COOKIE_NAME}=granted_v1; Path=/`;
    const calls: unknown[][] = [];
    window.gtag = (...args: unknown[]) => calls.push(args);
    const { rerender } = render(
      <AnalyticsProvider>
        <p>content</p>
      </AnalyticsProvider>,
    );
    rerender(
      <AnalyticsProvider>
        <p>content changed</p>
      </AnalyticsProvider>,
    );
    expect(calls.filter((c) => c[1] === "page_view")).toHaveLength(1);
  });

  it("cookie 版本不符時重新詢問", () => {
    enableEnv();
    document.cookie = `${CONSENT_COOKIE_NAME}=granted_v0; Path=/`;
    render(
      <AnalyticsProvider>
        <p>content</p>
      </AnalyticsProvider>,
    );
    expect(screen.getByText(ANALYTICS_CONSENT.accept)).toBeInTheDocument();
    expect(screen.queryByTestId("ga-script")).not.toBeInTheDocument();
  });
});

describe("AnalyticsSettings（隱私頁撤回入口）", () => {
  it("env 未設時照實說沒有可調整的設定", () => {
    render(
      <AnalyticsProvider>
        <AnalyticsSettings />
      </AnalyticsProvider>,
    );
    expect(screen.getByText(ANALYTICS_SETTINGS.unavailable)).toBeInTheDocument();
  });

  it("已同意時提供撤回，撤回後狀態與說明都更新", async () => {
    enableEnv();
    document.cookie = `${CONSENT_COOKIE_NAME}=granted_v1; Path=/`;
    render(
      <AnalyticsProvider>
        <AnalyticsSettings />
      </AnalyticsProvider>,
    );
    expect(screen.getByText(ANALYTICS_SETTINGS.grantedState)).toBeInTheDocument();

    await act(async () => {
      screen.getByText(ANALYTICS_SETTINGS.revoke).click();
    });
    expect(screen.getByText(ANALYTICS_SETTINGS.deniedState)).toBeInTheDocument();
    expect(screen.getByText(ANALYTICS_SETTINGS.revokedNote)).toBeInTheDocument();
    expect(document.cookie).toContain(`${CONSENT_COOKIE_NAME}=denied_v1`);
  });

  it("撤回後可重新同意", async () => {
    enableEnv();
    document.cookie = `${CONSENT_COOKIE_NAME}=denied_v1; Path=/`;
    render(
      <AnalyticsProvider>
        <AnalyticsSettings />
      </AnalyticsProvider>,
    );
    await act(async () => {
      screen.getByText(ANALYTICS_SETTINGS.grant).click();
    });
    expect(screen.getByText(ANALYTICS_SETTINGS.grantedState)).toBeInTheDocument();
  });
});

describe("TrackedLink", () => {
  it("未同意時仍是可用的連結，且不呼叫 gtag", () => {
    const calls: unknown[][] = [];
    window.gtag = (...args: unknown[]) => calls.push(args);
    render(
      <TrackedLink
        href="https://apps.apple.com/app/id1"
        target="_blank"
        event={{ name: "app_store_click", params: { placement: "hero" } }}
      >
        下載
      </TrackedLink>,
    );
    const link = screen.getByText("下載");
    expect(link).toHaveAttribute("href", "https://apps.apple.com/app/id1");

    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);
    expect(calls).toEqual([]);
    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it("已同意時送出事件，且新分頁連結不攔 default", () => {
    enableEnv();
    document.cookie = `${CONSENT_COOKIE_NAME}=granted_v1; Path=/`;
    const calls: unknown[][] = [];
    window.gtag = (...args: unknown[]) => calls.push(args);
    render(
      <TrackedLink
        href="https://course.ntutbox.com"
        target="_blank"
        event={{ name: "course_system_click", params: { placement: "ecosystem" } }}
      >
        排課系統
      </TrackedLink>,
    );
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    screen.getByText("排課系統").dispatchEvent(clickEvent);
    expect(calls).toEqual([
      ["event", "course_system_click", { site_surface: "website", placement: "ecosystem" }],
    ]);
    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it("gtag 爆掉不影響連結行為", () => {
    enableEnv();
    document.cookie = `${CONSENT_COOKIE_NAME}=granted_v1; Path=/`;
    window.gtag = () => {
      throw new Error("gtag exploded");
    };
    render(
      <TrackedLink
        href="https://apps.apple.com/app/id1"
        target="_blank"
        event={{ name: "app_store_click", params: { placement: "header" } }}
      >
        下載
      </TrackedLink>,
    );
    const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
    expect(() => screen.getByText("下載").dispatchEvent(clickEvent)).not.toThrow();
    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it("沒給 event 就是純連結（生態系裡不追蹤的那張卡）", () => {
    enableEnv();
    document.cookie = `${CONSENT_COOKIE_NAME}=granted_v1; Path=/`;
    const calls: unknown[][] = [];
    window.gtag = (...args: unknown[]) => calls.push(args);
    render(
      <TrackedLink href="https://status.ntutbox.com" target="_blank">
        狀態頁
      </TrackedLink>,
    );
    screen
      .getByText("狀態頁")
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    expect(calls).toEqual([]);
  });
});
