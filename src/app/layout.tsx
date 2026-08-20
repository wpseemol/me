import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ThreeBackground from '@/components/ThreeBackground';
import { ThemeProvider, themeInitScript } from '@/components/ThemeProvider';

import seo from '@/data/seo.json';
import {
  BASE_URL,
  allKeywords,
  abs,
  graph,
  personSchema,
  websiteSchema,
  profilePageSchema,
  faqSchema,
} from '@/lib/seo';

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
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
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
  // One @graph node set for the whole site — search engines and LLM crawlers
  // get the full picture from any entry page.
  const jsonLd = graph([
    personSchema(),
    websiteSchema(),
    profilePageSchema(),
    faqSchema(),
  ]);

  return (
    <html lang={seo.site.language} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="me" href="https://github.com/wpseemol" />
        <link rel="author" href="/about" />
        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href="/sitemap.xml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ThreeBackground />
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
