import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-40 text-center">
      <p className="text-[13px] font-semibold tracking-wide text-[var(--accent-ink)]">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--ink)]">
        找不到這個頁面
      </h1>
      <p className="mt-3 leading-7 text-[var(--ink-soft)]">
        這個網址不存在，或內容已經搬家了。
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-[var(--accent)] px-5 py-3 text-[15px] font-medium text-white"
      >
        回首頁
      </Link>
    </section>
  );
}
