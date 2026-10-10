import Link from "next/link";
import type { ReactNode } from "react";
import type { LegalBlock, LegalDocumentContent, LegalSection } from "@/content/legal/types";

const LINK_CLASS = "text-[var(--accent-ink)] underline underline-offset-4";
const TOKEN = /(\[[^\]]+\]\([^)]+\)|【待(?:確認|補)：[^】]*】)/g;

export function LegalRichText({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          const [, label, href] = link;
          if (href.startsWith("/")) {
            return (
              <Link key={i} href={href} className={LINK_CLASS}>
                {label}
              </Link>
            );
          }
          const external = href.startsWith("http");
          return (
            <a
              key={i}
              href={href}
              className={LINK_CLASS}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {label}
            </a>
          );
        }
        if (part.startsWith("【待")) {
          return (
            <mark
              key={i}
              className="rounded bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-1 text-[var(--ink)]"
            >
              {part}
            </mark>
          );
        }
        return part;
      })}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="mt-2">
          <LegalRichText text={block.text} />
        </p>
      );
    case "ul":
      return (
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {block.items.map((item) => (
            <li key={item}>
              <LegalRichText text={item} />
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th
                    key={h}
                    className="border-b border-[var(--overlay-border)] py-2 pr-4 font-semibold text-[var(--ink)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]} className="align-top">
                  {row.map((cell, i) => (
                    <td key={i} className="border-b border-[var(--overlay-border)] py-2 pr-4">
                      <LegalRichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** 內容檔以外的段落（例如需要客戶端小島的分析設定），由頁面自己組好再插進來。 */
export type CustomSection = { id: string; heading: string; content: ReactNode };

export function LegalDocument({
  doc,
  sections,
}: {
  doc: LegalDocumentContent;
  /** 省略時就是 doc.sections */
  sections?: (LegalSection | CustomSection)[];
}) {
  const all = sections ?? doc.sections;
  return (
    <article className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{doc.title}</h1>
      <p className="mt-2 text-sm text-[var(--ink-faint)]">
        最後更新：{doc.updated}・版本 {doc.version}
      </p>
      <div className="mt-8 space-y-8 text-[15px] leading-7 text-[var(--ink-soft)] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--ink)]">
        <nav aria-label="目錄">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {all.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="hover:text-[var(--accent-ink)]">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        {all.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2>{s.heading}</h2>
            {"content" in s ? s.content : s.blocks.map((b, i) => <Block key={i} block={b} />)}
          </section>
        ))}
      </div>
    </article>
  );
}
