"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SCREENSHOTS } from "@/content/site";
import { SectionHeading } from "@/components/site/section-heading";

export function Screenshots() {
  const stripRef = useRef<HTMLDivElement>(null);

  // 桌面首屏把橫向捲軸置中：兩側對稱、暗示可雙向滑動。
  // 行動版維持從第一張開始。
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
        {/* 截圖帶收在與其他區塊相同的內容寬度內，兩端以淡出收邊；
            px-10 讓首尾卡片捲到底時能離開淡出區完整顯示 */}
        <div
          ref={stripRef}
          className="thin-scroll fade-x-edges mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-10 pb-4"
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
      </div>
    </section>
  );
}
