import type { MetadataRoute } from 'next';
import seo from '@/data/seo.json';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: seo.site.name,
    short_name: seo.site.shortName,
    description: seo.site.defaultDescription,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: seo.site.themeColorDark,
    theme_color: seo.site.themeColorDark,
    orientation: 'portrait-primary',
    categories: ['portfolio', 'developer', 'business'],
    icons: [
      { src: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
