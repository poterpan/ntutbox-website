import { AppStoreButton } from "@/components/site/app-store-button";

export function GuestCta() {
  return (
    <section id="guest" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-16">
      <div className="glass-surface rounded-3xl px-8 py-12 text-center sm:px-16">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
          還沒有北科帳號？
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--ink-soft)]">
          訪客模式讓你免登入完整體驗 App
          的介面與操作，資料只存在你的裝置上——適合下載前試用，或還沒拿到帳號的準新生。
        </p>
        <AppStoreButton className="mt-8" />
      </div>
    </section>
  );
}
