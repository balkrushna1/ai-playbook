import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description: string;
  canonicalPath?: string;
  imageUrl?: string;
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const ensureMetaTag = (selector: string, attrs: Record<string, string>) => {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => tag!.setAttribute(key, value));
    document.head.appendChild(tag);
  }
  return tag;
};

const ensureLinkTag = (selector: string, rel: string) => {
  let tag = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = rel;
    document.head.appendChild(tag);
  }
  return tag;
};

export function useSeo({
  title,
  description,
  canonicalPath,
  imageUrl,
  noindex = false,
  structuredData,
}: SeoOptions) {
  useEffect(() => {
    const absoluteCanonical = canonicalPath
      ? new URL(canonicalPath, window.location.origin).toString()
      : window.location.href;

    const ogImage = imageUrl
      ? new URL(imageUrl, window.location.origin).toString()
      : new URL("/favicon.png", window.location.origin).toString();

    document.title = title;

    const descriptionMeta = ensureMetaTag('meta[name="description"]', { name: "description" });
    descriptionMeta.content = description;

    const robotsMeta = ensureMetaTag('meta[name="robots"]', { name: "robots" });
    robotsMeta.content = noindex ? "noindex, nofollow" : "index, follow";

    const canonicalLink = ensureLinkTag('link[rel="canonical"]', "canonical");
    canonicalLink.href = absoluteCanonical;

    const ogTitleMeta = ensureMetaTag('meta[property="og:title"]', { property: "og:title" });
    ogTitleMeta.content = title;

    const ogDescriptionMeta = ensureMetaTag('meta[property="og:description"]', { property: "og:description" });
    ogDescriptionMeta.content = description;

    const ogTypeMeta = ensureMetaTag('meta[property="og:type"]', { property: "og:type" });
    ogTypeMeta.content = "website";

    const ogUrlMeta = ensureMetaTag('meta[property="og:url"]', { property: "og:url" });
    ogUrlMeta.content = absoluteCanonical;

    const ogImageMeta = ensureMetaTag('meta[property="og:image"]', { property: "og:image" });
    ogImageMeta.content = ogImage;

    const twitterCardMeta = ensureMetaTag('meta[name="twitter:card"]', { name: "twitter:card" });
    twitterCardMeta.content = "summary_large_image";

    const twitterTitleMeta = ensureMetaTag('meta[name="twitter:title"]', { name: "twitter:title" });
    twitterTitleMeta.content = title;

    const twitterDescriptionMeta = ensureMetaTag('meta[name="twitter:description"]', { name: "twitter:description" });
    twitterDescriptionMeta.content = description;

    const twitterImageMeta = ensureMetaTag('meta[name="twitter:image"]', { name: "twitter:image" });
    twitterImageMeta.content = ogImage;

    let structuredDataScript: HTMLScriptElement | null = null;
    if (structuredData) {
      structuredDataScript = document.createElement("script");
      structuredDataScript.type = "application/ld+json";
      structuredDataScript.text = JSON.stringify(structuredData);
      document.head.appendChild(structuredDataScript);
    }

    return () => {
      if (structuredDataScript && structuredDataScript.parentNode) {
        structuredDataScript.parentNode.removeChild(structuredDataScript);
      }
    };
  }, [title, description, canonicalPath, imageUrl, noindex, structuredData]);
}
