import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import CanvasField from '@/components/CanvasField';
import Cursor from '@/components/Cursor';
import Intro from '@/components/Intro';
import SmoothScroll from '@/components/SmoothScroll';
import { ThemeProvider, themeInitScript } from '@/components/ThemeProvider';

import seo from '@/data/seo.json';
import { BASE_URL, allKeywords, abs, graph, personSchema, websiteSchema } from '@/lib/seo';
import { asset } from '@/lib/asset';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: seo.site.defaultTitle,
    template: seo.site.titleTemplate,
  },
  description: seo.site.defaultDescription,
  keywords: allKeywords(),
  applicationName: seo.site.shortName,
  authors: [{ name: 'Seemol Chakroborti', url: BASE_URL }],
  creator: 'Seemol Chakroborti',
  publisher: 'Seemol Chakroborti',
  generator: 'Next.js',
  category: 'technology',
  referrer: 'origin-when-cross-origin',
  alternates: {
    canonical: BASE_URL,
    languages: { 'en-US': BASE_URL, 'x-default': BASE_URL },
  },
  manifest: asset('/manifest.webmanifest'),
  icons: {
    icon: [
      { url: asset('/favicon.ico'), sizes: 'any' },
      { url: asset('/favicon-96x96.png'), type: 'image/png', sizes: '96x96' },
      { url: asset('/icon-192.png'), type: 'image/png', sizes: '192x192' },
      { url: asset('/icon-512.png'), type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: asset('/apple-touch-icon.png'), sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    siteName: seo.site.name,
    title: seo.site.defaultTitle,
    description: seo.site.defaultDescription,
    url: BASE_URL,
    locale: seo.site.locale,
    images: [
      {
        url: abs(seo.openGraph.image),
        width: seo.openGraph.imageWidth,
        height: seo.openGraph.imageHeight,
        alt: seo.openGraph.imageAlt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: seo.site.twitterHandle,
    creator: seo.site.twitterHandle,
    title: seo.site.defaultTitle,
    description: seo.site.defaultDescription,
    images: [abs(seo.openGraph.image)],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || seo.site.googleSiteVerification || undefined,
    other: {
      ...(seo.site.bingSiteVerification ? { 'msvalidate.01': seo.site.bingSiteVerification } : {}),
      ...(seo.site.yandexVerification ? { 'yandex-verification': seo.site.yandexVerification } : {}),
    },
  },
  other: {
    'ai-content-declaration': 'human-authored',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: seo.site.themeColorLight },
    { media: '(prefers-color-scheme: dark)', color: seo.site.themeColorDark },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Only the two site-wide entities live here. Page-level nodes (WebPage,
  // BreadcrumbList, FAQPage, ItemList) are emitted by each route, so their
  // @ids stay unique and a crawler is never told that /contact is also the
  // profile page.
  const jsonLd = graph([personSchema(), websiteSchema()]);

  return (
    <html lang={seo.site.language} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Loaded here rather than via an @import inside globals.css. A CSS
            @import cannot start downloading until the stylesheet that contains
            it has already arrived, which serialises two round trips onto the
            critical path and shows up directly in LCP. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,500;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
        <link rel="me" href="https://github.com/wpseemol" />
        <link rel="author" href={asset('/about')} />
        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href={asset('/sitemap.xml')}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SmoothScroll />
          <Intro />
          <CanvasField />
          <Cursor />
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
