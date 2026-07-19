import type { Metadata } from "next";
import { LINKS } from "@/content/site";

export const metadata: Metadata = {
  title: "隱私權政策",
  description:
    "北科盒子（NTUT Box）隱私權政策：帳號密碼僅儲存於裝置本地，不上傳任何第三方伺服器。",
  alternates: { canonical: "/privacy/" },
};

const UPDATED = "2026-07-19";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">隱私權政策</h1>
      <p className="mt-2 text-sm text-[var(--ink-faint)]">最後更新：{UPDATED}</p>
      <div className="mt-8 space-y-8 text-[15px] leading-7 text-[var(--ink-soft)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--ink)]">
        <section>
          <h2>適用範圍</h2>
          <p className="mt-2">
            本政策適用於「北科盒子（NTUT
            Box）」iOS 應用程式（下稱本 App）與本網站（ntutbox.com）。本 App
            為非官方應用程式，由北科大學生獨立開發，與國立臺北科技大學無正式關聯。
          </p>
        </section>
        <section>
          <h2>帳號與密碼</h2>
          <p className="mt-2">
            本 App 需以北科大校務系統帳號登入。你的帳號與密碼僅使用 iOS Keychain
            安全儲存於你的裝置本地，不會儲存或上傳到任何第三方伺服器；僅在需要時，用於與北科大官方系統進行認證。
          </p>
        </section>
        <section>
          <h2>校務資料</h2>
          <p className="mt-2">
            課表、成績、公告、行事曆等校務資料，由本 App
            以你的帳號直接向學校官方系統取得，儲存於你的裝置供功能顯示使用；除下述「課表分享」外，開發者的伺服器不會收集或保存這些資料。
          </p>
        </section>
        <section>
          <h2>課表分享</h2>
          <p className="mt-2">
            當你主動使用課表分享功能時，你選擇分享的課表內容（課程名稱與時段）會上傳以產生公開分享連結，任何取得連結的人都能檢視該課表，請自行斟酌分享對象。若需要移除已建立的分享連結，請透過下方管道聯絡我們。
          </p>
        </section>
        <section>
          <h2>匿名使用分析</h2>
          <p className="mt-2">
            為了解功能的使用情形並改善本
            App，我們使用 TelemetryDeck 服務蒐集匿名化的使用統計，內容僅限功能使用事件與其次數（例如：完成一次課表同步、送出一次教學評量、匯入課表的課程數量與所選學校範本）。這些統計不包含你的帳號、學號、姓名、成績、作答內容或任何可識別個人身分的資訊，也不會與你的身分連結。你可以隨時在
            App 的「更多」頁面關閉匿名統計。除上述匿名統計外，本 App
            不與任何第三方分享你的資料，也不含廣告。
          </p>
        </section>
        <section>
          <h2>訪客模式</h2>
          <p className="mt-2">訪客模式不需要任何帳號，所有示範資料僅存在於你的裝置本地。</p>
        </section>
        <section>
          <h2>資料保留與刪除</h2>
          <p className="mt-2">
            儲存於裝置本地的資料（帳號、課表、成績等）會在你刪除本 App
            時一併移除。已建立的課表分享連結，可透過下方管道聯絡我們移除。匿名使用統計無法對應到特定使用者，因此不存在可個別刪除的個人紀錄。
          </p>
        </section>
        <section>
          <h2>本網站</h2>
          <p className="mt-2">
            本網站為純靜態頁面，不使用
            cookie，不埋設任何追蹤或分析程式，也不蒐集任何個人資料。網站由 Cloudflare
            代管，Cloudflare 可能基於安全與效能目的處理必要的連線紀錄。
          </p>
        </section>
        <section>
          <h2>政策變更</h2>
          <p className="mt-2">
            本政策若有重大變更，會直接更新本頁內容並調整「最後更新」日期。
          </p>
        </section>
        <section>
          <h2>聯絡我們</h2>
          <p className="mt-2">
            對本政策或個人資料處理有任何疑問，歡迎透過 Instagram{" "}
            <a
              href={LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-ink)] underline underline-offset-4"
            >
              @ntutbox_official
            </a>{" "}
            或 email{" "}
            <a
              href={`mailto:${LINKS.email}`}
              className="text-[var(--accent-ink)] underline underline-offset-4"
            >
              {LINKS.email}
            </a>{" "}
            與我們聯絡。
          </p>
        </section>
      </div>
    </article>
  );
}
