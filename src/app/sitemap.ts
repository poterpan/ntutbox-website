import type { MetadataRoute } from "next";
import { SITE_URL } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "privacy/", "support/", "about/", "guide/selection/"].map((path) => ({
    url: `${SITE_URL}/${path}`,
    lastModified: new Date(),
  }));
}
