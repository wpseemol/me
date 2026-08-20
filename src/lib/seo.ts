import type { Metadata } from 'next';
import seo from '@/data/seo.json';
import site from '@/data/site.json';

export type PageKey = keyof typeof seo.pages;

export const SEO = seo;
export const SITE = site;

/** Canonical origin. Env var wins so preview deploys don't self-canonicalise wrongly. */
export const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || seo.site.url
).replace(/\/+$/, '');

export const abs = (path: string) =>
  path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

/** Every keyword group flattened and de-duplicated. */
export function allKeywords(extra: string[] = []): string[] {
  const { primary, secondary, developer } = seo.keywords;
  return Array.from(new Set([...primary, ...secondary, ...developer, ...extra]));
}

/**
 * Build a page's <head> from data/seo.json. Pass a page key and everything —
 * title, description, keywords, canonical, OG, Twitter — is derived.
 */
export function pageMetadata(key: PageKey, overrides: Partial<Metadata> = {}): Metadata {
  const page = seo.pages[key];
  const og = seo.openGraph;
  const url = abs(page.path);
  const image = abs(og.image);

  return {
    title: page.title,
    description: page.description,
    keywords: allKeywords(page.keywords),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      siteName: seo.site.name,
      title: page.title,
      description: page.description,
      locale: seo.site.locale,
      images: [
        {
          url: image,
          width: og.imageWidth,
          height: og.imageHeight,
          alt: og.imageAlt,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: seo.site.twitterHandle,
      creator: seo.site.twitterHandle,
      title: page.title,
      description: page.description,
      images: [image],
    },
    ...overrides,
  };
}

/* ------------------------------------------------------------------ JSON-LD */

const PERSON_ID = `${BASE_URL}/#person`;
const SITE_ID = `${BASE_URL}/#website`;

export function personSchema() {
  const p = site.profile;
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: p.name,
    alternateName: p.alternateNames,
    givenName: p.firstName,
    familyName: 'Chakroborti',
    jobTitle: seo.person.jobTitle,
    description: p.shortBio,
    url: BASE_URL,
    email: `mailto:${p.email}`,
    // Both the portrait and the OG card are declared so Google Images has a
    // high-resolution, correctly-licensed file to associate with the name.
    image: {
      '@type': 'ImageObject',
      '@id': `${BASE_URL}/#portrait`,
      url: abs(p.portrait),
      contentUrl: abs(p.portrait),
      width: 1200,
      height: 1200,
      caption: p.portraitAlt,
      representativeOfPage: true,
      creditText: p.name,
      creator: { '@type': 'Person', name: p.name },
      copyrightNotice: `© ${new Date().getFullYear()} ${p.name}`,
      license: `${BASE_URL}/about`,
      acquireLicensePage: `${BASE_URL}/contact`,
    },
    knowsAbout: seo.person.knowsAbout,
    knowsLanguage: p.languages,
    sameAs: seo.person.sameAs,
    address: {
      '@type': 'PostalAddress',
      addressLocality: p.location.city,
      addressRegion: p.location.region,
      addressCountry: p.location.countryCode,
    },
    worksFor: { '@type': 'Organization', name: seo.person.worksFor },
    seeks: seo.person.seeks.map((s) => ({ '@type': 'Demand', name: s })),
    hasOccupation: {
      '@type': 'Occupation',
      name: seo.person.jobTitle,
      occupationLocation: { '@type': 'Country', name: p.location.country },
      skills: site.stack.map((s) => s.name).join(', '),
    },
  };
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: BASE_URL,
    name: seo.site.name,
    alternateName: seo.site.shortName,
    description: seo.site.defaultDescription,
    inLanguage: seo.site.language,
    publisher: { '@id': PERSON_ID },
    copyrightHolder: { '@id': PERSON_ID },
  };
}

export function profilePageSchema() {
  return {
    '@type': 'ProfilePage',
    '@id': `${BASE_URL}/#profilepage`,
    url: BASE_URL,
    name: seo.pages.home.title,
    about: { '@id': PERSON_ID },
    mainEntity: { '@id': PERSON_ID },
    isPartOf: { '@id': SITE_ID },
    primaryImageOfPage: { '@id': `${BASE_URL}/#portrait` },
  };
}

export function servicesSchema() {
  return site.services.map((s) => ({
    '@type': 'Service',
    '@id': `${BASE_URL}/services#${s.slug}`,
    name: s.title,
    description: s.summary,
    serviceType: s.title,
    provider: { '@id': PERSON_ID },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${BASE_URL}/contact`,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${s.title} deliverables`,
      itemListElement: s.deliverables.map((d) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: d },
      })),
    },
  }));
}

export function projectsSchema() {
  return {
    '@type': 'ItemList',
    '@id': `${BASE_URL}/projects#list`,
    name: 'Projects by Seemol Chakroborti',
    itemListElement: site.projects.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareSourceCode',
        name: p.name,
        description: p.description,
        codeRepository: p.url,
        programmingLanguage: p.language,
        author: { '@id': PERSON_ID },
        keywords: p.tags.join(', '),
      },
    })),
  };
}

export function faqSchema() {
  return {
    '@type': 'FAQPage',
    '@id': `${BASE_URL}/#faq`,
    mainEntity: site.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

/** Wrap any set of nodes into one @graph document. */
export function graph(nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
