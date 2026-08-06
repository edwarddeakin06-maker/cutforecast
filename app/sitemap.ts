import type { MetadataRoute } from "next";

const siteUrl = "https://cutforecast.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const calculatorPages = [
    "",
    "/weight-loss-calculator",
    "/body-fat-calculator",
    "/calorie-deficit-calculator",
    "/how-long-to-lose-weight",
    "/free-cut-plan",
    "/how-long-to-lose/5kg",
    "/how-long-to-lose/10kg",
    "/how-long-to-lose/15kg",
    "/how-long-to-lose/20kg",
  ];

  return calculatorPages.map((path, index) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
