import {
  APP_NAME,
  APP_NAME_EN,
  APP_RATING,
  APP_STORE_URL,
  LINKS,
  SITE_DESCRIPTION,
  SITE_URL,
} from "@/content/site";
import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Features } from "@/components/site/features";
import { Screenshots } from "@/components/site/screenshots";
import { GuestCta } from "@/components/site/guest-cta";
import { Ecosystem } from "@/components/site/ecosystem";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Google「網站名稱」吃 WebSite、應用資訊吃 SoftwareApplication；同站以 @graph 併一份
//（與 ntutbox-course apps/web/src/app/layout.tsx 同模式）。
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: APP_NAME,
      alternateName: APP_NAME_EN,
      inLanguage: "zh-Hant",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: APP_NAME,
      alternateName: APP_NAME_EN,
      description: SITE_DESCRIPTION,
      operatingSystem: "iOS",
      // schema.org 枚舉值為 EducationalApplication（非 EducationApplication）
      applicationCategory: "EducationalApplication",
      // App Store 分級 4+（itunes lookup country=tw 已驗證）
      contentRating: "4+",
      // 用自家穩定圖檔（180×180），不寫死易變的 App Store CDN hash URL
      image: `${SITE_URL}/apple-touch-icon.png`,
      author: { "@type": "Person", name: "PoterPan", url: LINKS.github },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TWD",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: APP_RATING.value,
        ratingCount: APP_RATING.count,
        reviewCount: APP_RATING.count,
        bestRating: "5",
        worstRating: "1",
      },
      url: `${SITE_URL}/`,
      downloadUrl: APP_STORE_URL,
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Features />
      <Screenshots />
      <GuestCta />
      <Ecosystem />
    </>
  );
}
