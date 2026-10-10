import type { Metadata } from "next";
import {
  ANALYTICS_SETTINGS,
  APP_NAME,
  PRIVACY_ANALYTICS,
  PRIVACY_WEBSITE_PARAGRAPH,
  SITE_URL,
} from "@/content/site";
import { PRIVACY, PRIVACY_CHANGES, PRIVACY_CONTACT } from "@/content/legal/privacy";
import { AnalyticsSettings } from "@/components/analytics/analytics-settings";
import { LegalDocument, LegalRichText } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: PRIVACY.title,
  description: PRIVACY.metaDescription,
  alternates: { canonical: "/privacy/" },
  openGraph: {
    title: `${PRIVACY.title} — ${APP_NAME}`,
    description: PRIVACY.metaDescription,
    url: `${SITE_URL}/privacy/`,
  },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      doc={PRIVACY}
      sections={[
        ...PRIVACY.sections,
        {
          id: "website-analytics",
          heading: PRIVACY_ANALYTICS.heading,
          content: (
            <>
              <p className="mt-2">{PRIVACY_ANALYTICS.intro}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {PRIVACY_ANALYTICS.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <p className="mt-3">
                {PRIVACY_ANALYTICS.googlePolicyIntro}
                <a
                  href={PRIVACY_ANALYTICS.googlePolicyHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-[var(--accent-ink)] underline underline-offset-4"
                >
                  {PRIVACY_ANALYTICS.googlePolicyLabel}
                </a>
                。
              </p>
            </>
          ),
        },
        {
          id: "analytics-settings",
          heading: ANALYTICS_SETTINGS.heading,
          // 狀態與按鈕需要讀 cookie，只能在瀏覽器決定 → 客戶端小島
          content: <AnalyticsSettings />,
        },
        {
          id: "website",
          heading: "本網站",
          content: <p className="mt-2">{PRIVACY_WEBSITE_PARAGRAPH}</p>,
        },
        ...[PRIVACY_CHANGES, PRIVACY_CONTACT].map(({ id, heading, text }) => ({
          id,
          heading,
          content: (
            <p className="mt-2">
              <LegalRichText text={text} />
            </p>
          ),
        })),
      ]}
    />
  );
}
