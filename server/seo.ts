type SeoPayload = {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  structuredData: string;
};

type PlaybookSeoInput = {
  slug: string;
  title: string;
  shortDescription: string;
  authorName: string;
  toolsUsed: string[];
  createdAt?: Date | string | null;
  estimatedTime?: string;
  ratingCount?: number;
  averageRating?: number | null;
  steps: Array<{
    stepNumber: number;
    title: string;
    description: string;
    expectedOutput: string;
  }>;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, "");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const parseEstimatedTimeToDuration = (value?: string) => {
  if (!value) return undefined;
  const text = value.toLowerCase();
  const minuteMatch = text.match(/(\d+)\s*(min|minute)/);
  const hourMatch = text.match(/(\d+)\s*(h|hr|hour)/);

  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  const hours = hourMatch ? Number(hourMatch[1]) : 0;

  if (!minutes && !hours) return undefined;
  if (hours && minutes) return `PT${hours}H${minutes}M`;
  if (hours) return `PT${hours}H`;
  return `PT${minutes}M`;
};

const buildDefaultStructuredData = (siteUrl: string) =>
  JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "PlaybookAI",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/explore?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    null,
    0,
  );

export function getDefaultSeo(siteBaseUrl: string): SeoPayload {
  const siteUrl = normalizeBaseUrl(siteBaseUrl);
  const title = "PlaybookAI | AI Workflow Playbooks & Prompt Guides";
  const description =
    "Discover proven AI workflows and prompt playbooks for writing, coding, design, and marketing.";
  const canonicalUrl = `${siteUrl}/`;
  const imageUrl = `${siteUrl}/favicon.png`;

  return {
    title,
    description,
    canonicalUrl,
    robots: "index, follow",
    ogTitle: title,
    ogDescription: description,
    ogType: "website",
    ogImage: imageUrl,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
    structuredData: buildDefaultStructuredData(siteUrl),
  };
}

export function getPlaybookSeo(siteBaseUrl: string, playbook: PlaybookSeoInput): SeoPayload {
  const siteUrl = normalizeBaseUrl(siteBaseUrl);
  const title = `${playbook.title} | PlaybookAI`;
  const description = playbook.shortDescription;
  const canonicalUrl = `${siteUrl}/playbook/${encodeURIComponent(playbook.slug)}`;
  const imageUrl = `${siteUrl}/favicon.png`;

  const howToSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: playbook.title,
    description: playbook.shortDescription,
    url: canonicalUrl,
    author: {
      "@type": "Person",
      name: playbook.authorName,
    },
    tool: playbook.toolsUsed.map((tool) => ({
      "@type": "HowToTool",
      name: tool,
    })),
    step: [...playbook.steps]
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.title,
        text: `${step.description} Expected output: ${step.expectedOutput}`,
      })),
  };

  const duration = parseEstimatedTimeToDuration(playbook.estimatedTime);
  if (duration) {
    howToSchema.totalTime = duration;
  }

  if (playbook.createdAt) {
    const date = new Date(playbook.createdAt);
    if (!Number.isNaN(date.getTime())) {
      howToSchema.datePublished = date.toISOString();
    }
  }

  if ((playbook.ratingCount || 0) > 0 && playbook.averageRating) {
    howToSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: playbook.averageRating,
      ratingCount: playbook.ratingCount,
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Explore",
        item: `${siteUrl}/explore`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: playbook.title,
        item: canonicalUrl,
      },
    ],
  };

  return {
    title,
    description,
    canonicalUrl,
    robots: "index, follow",
    ogTitle: title,
    ogDescription: description,
    ogType: "article",
    ogImage: imageUrl,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: imageUrl,
    structuredData: JSON.stringify([howToSchema, breadcrumbSchema]),
  };
}

export function injectSeoIntoHtml(html: string, payload: SeoPayload): string {
  return html
    .replaceAll("__SEO_TITLE__", escapeHtml(payload.title))
    .replaceAll("__SEO_DESCRIPTION__", escapeHtml(payload.description))
    .replaceAll("__SEO_CANONICAL_URL__", escapeHtml(payload.canonicalUrl))
    .replaceAll("__SEO_ROBOTS__", escapeHtml(payload.robots))
    .replaceAll("__SEO_OG_TITLE__", escapeHtml(payload.ogTitle))
    .replaceAll("__SEO_OG_DESCRIPTION__", escapeHtml(payload.ogDescription))
    .replaceAll("__SEO_OG_TYPE__", escapeHtml(payload.ogType))
    .replaceAll("__SEO_OG_IMAGE__", escapeHtml(payload.ogImage))
    .replaceAll("__SEO_TWITTER_TITLE__", escapeHtml(payload.twitterTitle))
    .replaceAll("__SEO_TWITTER_DESCRIPTION__", escapeHtml(payload.twitterDescription))
    .replaceAll("__SEO_TWITTER_IMAGE__", escapeHtml(payload.twitterImage))
    .replace("__SEO_STRUCTURED_DATA__", payload.structuredData);
}
