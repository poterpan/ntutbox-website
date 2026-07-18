import Image from "next/image";
import { SCREENSHOTS } from "@/content/site";
import { SectionHeading } from "@/components/site/section-heading";

export function Screenshots() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading eyebrow="截圖" title="親眼看看" />
      </div>
      <div className="thin-scroll mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(1.5rem,calc((100vw-64rem)/2))] pb-4">
        {SCREENSHOTS.map((s) => (
          <div
            key={s.src}
            className="glass-soft w-[220px] shrink-0 snap-center overflow-hidden rounded-3xl p-2"
          >
            <Image
              src={s.src}
              alt={s.alt}
              width={600}
              height={1300}
              className="h-auto w-full rounded-2xl"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
