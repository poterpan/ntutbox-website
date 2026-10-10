import type { Metadata } from "next";
import { APP_NAME, SITE_URL } from "@/content/site";
import { TERMS } from "@/content/legal/terms";
import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: TERMS.title,
  description: TERMS.metaDescription,
  alternates: { canonical: "/terms/" },
  openGraph: {
    title: `${TERMS.title} — ${APP_NAME}`,
    description: TERMS.metaDescription,
    url: `${SITE_URL}/terms/`,
  },
};

export default function TermsPage() {
  return <LegalDocument doc={TERMS} />;
}
