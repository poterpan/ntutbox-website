import {
  APP_NAME,
  APP_NAME_EN,
  APP_RATING,
  APP_STORE_URL,
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
      applicationCategory: "EducationApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: APP_RATING.value,
        ratingCount: String(APP_RATING.count),
      },
      url: SITE_URL,
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
