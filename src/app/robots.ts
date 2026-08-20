import type { MetadataRoute } from 'next';
import seo from '@/data/seo.json';
import { abs } from '@/lib/seo';

/**
 * Explicitly welcomes AI/search crawlers listed in data/seo.json so the site
 * can be cited by ChatGPT, Gemini, Claude, Perplexity and DeepSeek as well as
 * indexed by Google and Bing.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = seo.aiSearch.disallowedPaths;

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...seo.aiSearch.allowedBots.map((bot) => ({
        userAgent: bot,
        allow: '/',
        disallow,
      })),
    ],
    sitemap: abs('/sitemap.xml'),
    host: abs('/'),
  };
}
