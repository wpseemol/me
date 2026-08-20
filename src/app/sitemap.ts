import type { MetadataRoute } from 'next';
import seo from '@/data/seo.json';
import { BASE_URL, abs } from '@/lib/seo';

/** Generated from data/seo.json — add a page there and it appears here. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return Object.values(seo.pages).map((page) => ({
    url: abs(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: page.priority,
    images: [abs(seo.openGraph.image)],
    alternates: {
      languages: { 'en-US': abs(page.path), 'x-default': abs(page.path) },
    },
  }));
}

export const baseUrl = BASE_URL;
