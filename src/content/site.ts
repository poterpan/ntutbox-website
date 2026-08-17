import type { ComponentType, SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  Clock,
  Compass,
  LayoutGrid,
  ListOrdered,
  TrendingUp,
} from "lucide-react";
import {
  GitHubGlyph,
  InstagramGlyph,
  ThreadsGlyph,
} from "@/components/site/social-icons";

export const SITE_URL = "https://ntutbox.com";
export const APP_NAME = "北科盒子";
export const APP_NAME_EN = "NTUT Box";
export const APP_TAGLINE = "提供北科學生方便的校務體驗";
export const APP_STORE_URL = "https://apps.apple.com/tw/app/id6753217696";
/* 官網下載入口統一帶 campaign 參數（App Store Connect → App 分析 → 廣告活動，ct=website）。
   JSON-LD 的 downloadUrl 維持上面的乾淨網址。 */
export const APP_STORE_CAMPAIGN_URL =
  "https://apps.apple.com/app/apple-store/id6753217696?pt=126597733&ct=website&mt=8";

export const SITE_TITLE = "北科盒子 NTUT Box — 北科大學生的智慧課表 App";
export const SITE_DESCRIPTION =
  "課表同步、成績查詢、期末預選選課、i 學園整合、60+ 項校務服務一鍵直達。由北科學生獨立開發的非官方校務 App，iPhone 免費下載。";

export const DISCLAIMER =
  "本 App 為非官方應用程式，與國立臺北科技大學無正式關聯。所有課表資料來源於 NTUT 官方教務系統。";

export const PLATFORM_NOTE =
  "免費下載・iOS 18.2 以上・為 iPhone 設計，iPad 與 Apple Silicon Mac 亦可安裝使用";

export const APP_RATING = { value: "4.8", count: 18 };

export const LINKS = {
  courseSystem: "https://course.ntutbox.com",
  status: "https://status.ntutbox.com",
  instagram: "https://www.instagram.com/ntutbox_official",
  threads: "https://www.threads.com/@ntutbox_official",
  github: "https://github.com/poterpan",
  email: "poter.pan@panspace.me",
  courseGithub: "https://github.com/poterpan/ntutbox-course",
  websiteGithub: "https://github.com/poterpan/ntutbox-website",
  templateApi: "https://github.com/poterpan/ntutbox-template-api",
};

export type Social = {
  /* 平台名不顯示於畫面（只留 icon），供 aria-label 使用 */
  platform: string;
  /* 顯示文字：帳號 handle 或開源專案名 */
  text: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/* App 本身未開源——GitHub 兩條連結各自標明專案，避免被誤解為 App 原始碼 */
export const SOCIALS: Social[] = [
  { platform: "Instagram", text: "@ntutbox_official", href: LINKS.instagram, icon: InstagramGlyph },
  { platform: "Threads", text: "@ntutbox_official", href: LINKS.threads, icon: ThreadsGlyph },
  { platform: "GitHub", text: "排課系統", href: LINKS.courseGithub, icon: GitHubGlyph },
  { platform: "GitHub", text: "課表範本 API", href: LINKS.templateApi, icon: GitHubGlyph },
];

export type Feature = { icon: LucideIcon; title: string; description: string };

export const MAIN_FEATURES: Feature[] = [
  {
    icon: Calendar,
    title: "課表同步",
    description:
      "登入即自動抓取本學期課表，週視圖清楚呈現、連堂自動合併，不用自己抄課表。",
  },
  {
    icon: Clock,
    title: "今日總覽",
    description: "現在上什麼課、下一堂在哪、還有多久下課，打開 App 一眼掌握。",
  },
  {
    icon: LayoutGrid,
    title: "桌面小工具",
    description: "主畫面與鎖定畫面直接顯示當前與下一堂課，不必開 App 就能看。",
  },
  {
    icon: TrendingUp,
    title: "成績查詢",
    description:
      "各科成績、歷年 GPA 圖表、班級／分組／系所排名與 Top 百分比，一次看清楚。",
  },
  {
    icon: ListOrdered,
    title: "期末預選選課",
    description:
      "App 內加選本班與外班課程，多選加拖曳排志願，送出後逐門回報選上與否。",
  },
  {
    icon: BookOpen,
    title: "i 學園整合",
    description: "公告、作業、教材、修課名單一站看齊，課程錄影也能直接串流播放。",
  },
  {
    icon: Compass,
    title: "校園服務入口",
    description: "7 大類 60+ 項校務服務一鍵直達，多數支援 SSO 免再登入。",
  },
  {
    icon: CalendarCheck,
    title: "校園行事曆",
    description:
      "自動同步學校行事曆並可匯出到 Apple 日曆，期中考、選課、放假不再錯過。",
  },
];

export type MinorFeature = { title: string; description: string; badge?: string };

export const MORE_FEATURES: MinorFeature[] = [
  {
    title: "Live Activity 動態島",
    description: "上課前自動顯示課程資訊，整堂課倒數與進度即時更新，逐步完善中。",
    badge: "開發中",
  },
  { title: "課前通知", description: "每週自動排程提醒，沒開 App 也準時通知上課。" },
  { title: "北科小郵差", description: "校園公告依 6 種分類篩選，支援詳情與附件下載。" },
  {
    title: "教學評量快速填寫",
    description: "自動帶入預設答案，開放期間主動提醒，不再錯過。",
  },
  { title: "傑出教學獎票選", description: "在 App 內完成投票，直接解鎖成績查詢。" },
  { title: "選課確認", description: "「確認選課結果」等一次性手續，App 內完成。" },
  { title: "失物招領", description: "瀏覽學務處遺失物公告，支援搜尋與學期切換。" },
  { title: "個人作業清單", description: "手動新增待辦作業，獨立於 i 學園之外管理。" },
  { title: "課表匯入與範本", description: "從外部範本或手動建立課表，含匯入預覽。" },
  { title: "課表分享", description: "一條連結把課表分享給同學，或匯入他人課表。" },
];

export const COMING_SOON = ["多學期課表查詢", "iCal 匯出"];

export type Screenshot = { src: string; alt: string };

export const SCREENSHOTS: Screenshot[] = [
  {
    src: "/screenshots/preview-1.webp",
    alt: "今日總覽畫面，顯示目前上課中的課程倒數、待辦事項與近期行程",
  },
  {
    src: "/screenshots/preview-2.webp",
    alt: "登入畫面，輸入北科大學號與密碼即可一鍵同步課表",
  },
  {
    src: "/screenshots/preview-3.webp",
    alt: "桌面小工具設定畫面，顯示當前課程時間與地點",
  },
  {
    src: "/screenshots/preview-4.webp",
    alt: "成績查詢畫面，顯示歷年 GPA、班級與系所排名及各科成績",
  },
  {
    src: "/screenshots/preview-5.webp",
    alt: "建立課表畫面，可選擇學校範本或用 AI 轉換課表文字",
  },
  {
    src: "/screenshots/preview-6.webp",
    alt: "行事曆整合畫面，課表與校園行事曆同步至系統行事曆",
  },
  {
    src: "/screenshots/preview-7.webp",
    alt: "課表匯入確認畫面，顯示學校、學期與課程清單",
  },
  {
    src: "/screenshots/preview-8.webp",
    alt: "北科小郵差公告列表，依分類篩選顯示標題與發布日期",
  },
  {
    src: "/screenshots/preview-11.webp",
    alt: "分享課表畫面，產生連結與 QR Code 供他人一鍵匯入",
  },
];

export type FaqItem = { q: string; a: string };

export const FAQ: FaqItem[] = [
  {
    q: "使用北科盒子需要什麼帳號？",
    a: "需要北科大校務系統帳號（學號與密碼）。還沒有帳號的話，可以用「訪客模式」免登入體驗完整介面與操作。",
  },
  {
    q: "我的帳號密碼安全嗎？",
    a: "密碼使用 iOS Keychain 安全儲存於你的裝置本地，不會上傳到任何第三方伺服器，僅在需要時與北科大官方系統進行認證。",
  },
  {
    q: "課表或成績突然抓不到資料怎麼辦？",
    a: "多半是學校系統維護或改版造成。可以先到服務狀態頁查看各校務系統的即時狀態；若學校系統顯示正常但 App 仍無法使用，請透過下方管道聯絡我們。",
  },
  {
    q: "支援哪些裝置？",
    a: "北科盒子為 iPhone 設計（需 iOS 18.2 以上），iPad 與 Apple Silicon Mac 亦可安裝使用。",
  },
  {
    q: "北科盒子是學校官方 App 嗎？",
    a: "不是。北科盒子由北科學生獨立開發，與國立臺北科技大學無正式關聯；所有校務資料都來自學校官方系統。",
  },
  {
    q: "如何回報問題或提出建議？",
    a: "歡迎透過 Instagram @ntutbox_official 私訊，或寄信到 poter.pan@panspace.me。",
  },
];

/* ── 成效分析同意（GA4 opt-in）────────────────────────────────────
   規格：docs/marketing/2026-08-17-ga4-google-ads-handoff.md §4。
   「同意」與「拒絕」必須同等可見：兩顆按鈕同尺寸同字重，只以文字色區分。 */
export const ANALYTICS_CONSENT = {
  title: "可以記錄匿名使用統計嗎？",
  body:
    "我們想知道有多少人找到北科盒子、以及哪些入口真的被使用，用來評估宣傳成效。統計是匿名的，不含你的學號、姓名、搜尋文字或課程選擇。",
  accept: "同意成效分析",
  decline: "拒絕",
  policyLabel: "了解我們收集什麼",
  ariaLabel: "成效分析同意選項",
};

export const ANALYTICS_SETTINGS = {
  heading: "分析設定",
  loading: "正在讀取目前的設定…",
  unavailable: "本站目前未載入任何分析程式，因此沒有可調整的設定。",
  grantedState: "目前狀態：已同意匿名成效分析。",
  deniedState: "目前狀態：已拒絕，本站不會載入 Google Analytics。",
  unsetState: "目前狀態：尚未選擇。在你選擇「同意」之前，本站不會載入 Google Analytics。",
  grant: "同意成效分析",
  revoke: "撤回同意",
  revokedNote:
    "已撤回同意，並清除本站可刪除的分析 cookie；後續不再送出任何分析事件。",
  leftoverNote:
    "以下 cookie 無法由網頁端刪除，將於到期後自動失效，你也可以在瀏覽器設定中手動清除：",
};

/* 隱私頁「網站分析與廣告成效」段落。六個 bullet 對應規格 §4 的必要涵蓋項目。
   ⚠️ 對外法律承諾，owner 逐字核可後才可 merge（CLAUDE.md「隱私權政策 = 對外承諾」）。 */
export const PRIVACY_ANALYTICS = {
  heading: "網站分析與廣告成效",
  intro:
    "本節適用於本網站（ntutbox.com）與排課系統（course.ntutbox.com）。在你明確同意之前，兩站都不會載入 Google 的任何程式、不會建立分析 cookie，也不會發出任何測量請求。",
  bullets: [
    "取得你的同意後，我們才使用 Google Analytics 4 統計網站使用情形，並用 Google Ads 衡量廣告成效歸因。",
    "收集的內容限於：頁面瀏覽、匿名的功能點擊事件（例如點了下載或前往排課系統）、裝置與瀏覽器的概略資訊，以及廣告來源參數。",
    "使用第一方 cookie 區分造訪來源與工作階段；我們不做廣告個人化，也不做再行銷或建立廣告受眾。",
    "不收集帳號密碼、學號、姓名、班級、搜尋文字、課程選擇、分享連結內容或匯入 App 的資料。",
    "你可以拒絕，也可以在同意後隨時於下方「分析設定」撤回；撤回後不再送出任何事件。",
    "網址在送出前會先清洗：只保留廣告來源參數（utm_*、Google click ID），移除課程、計畫、權杖等其他參數與錨點。",
  ],
  googlePolicyIntro: "Google 如何處理這些資料，請參閱",
  googlePolicyLabel: "Google 隱私權政策",
  googlePolicyHref: "https://policies.google.com/privacy",
};

/* 取代舊文「本網站為純靜態頁面，不使用 cookie，不埋設任何追蹤或分析程式」。 */
export const PRIVACY_WEBSITE_PARAGRAPH =
  "本網站為靜態頁面，沒有會員系統，也不要求你提供任何個人資料。除上節所述、且需經你同意才啟用的成效分析外，本網站只會在你做出選擇後寫入一個記錄該選擇的 cookie。網站由 Cloudflare 代管，Cloudflare 可能基於安全與效能目的處理必要的連線紀錄。";

export const ECOSYSTEM = [
  {
    title: "北科盒子 排課系統",
    href: LINKS.courseSystem,
    display: "course.ntutbox.com",
    description:
      "免登入的網頁版排課規劃器：全文查課、多維篩選、衝堂偵測、學分統計、教學大綱。",
    stats: "收錄 11 個學期、32,000+ 筆開課資料，每日自動更新",
  },
  {
    title: "服務狀態頁",
    href: LINKS.status,
    display: "status.ntutbox.com",
    description:
      "即時監控北科 Portal、選課系統、i 學園等校務系統連線狀態，系統掛了先來這裡看。",
    stats: "監控 6 個校務系統",
  },
];
