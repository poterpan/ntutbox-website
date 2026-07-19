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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
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
