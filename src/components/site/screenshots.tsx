"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SCREENSHOTS } from "@/content/site";
import { SectionHeading } from "@/components/site/section-heading";

export function Screenshots() {
  const stripRef = useRef<HTMLDivElement>(null);

  // 桌面首屏把橫向捲軸置中：兩側對稱出血、暗示可雙向滑動。
  // 行動版維持從第一張開始（窄視口下本來就沒有左側留白問題）。
  useEffect(() => {
    const el = stripRef.current;
    if (el && window.matchMedia("(min-width: 1024px)").matches) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    }
  }, []);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading eyebrow="截圖" title="親眼看看" />
      </div>
      <div
        ref={stripRef}
        className="thin-scroll mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4"
      >
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
