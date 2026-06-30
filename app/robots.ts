import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://sheetstride.onrender.com";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/patterns", "/topics"],
      disallow: [
        "/dashboard",
        "/profile",
        "/progress",
        "/settings",
        "/questions",
        "/api",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
