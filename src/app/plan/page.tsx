import type { Metadata } from "next";
import { APP_NAME, SITE_URL } from "@/content/site";
import { PlanHandoff } from "./PlanHandoff";

export const metadata: Metadata = {
  title: "預排課表",
  description: "在北科盒子 App 開啟你從排課系統匯出的預排課表。",
  alternates: { canonical: "/plan/" },
  // 這是交付用的中繼頁，沒有內容價值，不該進索引。
  // sitemap.ts 是明確 allowlist（:7），不加就自動排除，無需額外改動。
  robots: { index: false, follow: false },
  openGraph: {
    title: `預排課表 — ${APP_NAME}`,
    description: "在北科盒子 App 開啟你從排課系統匯出的預排課表。",
    url: `${SITE_URL}/plan/`,
  },
};

export default function PlanPage() {
  return <PlanHandoff />;
}
