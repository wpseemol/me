import Link from 'next/link';
import type { Metadata } from 'next';
import site from '@/data/site.json';
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  pageMetadata,
  profilePageSchema,
  webPageSchema,
} from '@/lib/seo';

import Hero from '@/components/Hero';
import Reveal from '@/components/Reveal';
import { SectionHead } from '@/components/Section';
import {
  CtaBand,
  Faq,
  ProcessList,
  ProjectCard,
  ServiceCard,
  StackBars,
  TechMarquee,
} from '@/components/Blocks';
import { ArrowIcon } from '@/components/Icons';

export const metadata: Metadata = pageMetadata('home');

export default function HomePage() {
  const jsonLd = graph([
    webPageSchema('home'),
    profilePageSchema(),
    breadcrumbSchema([{ name: 'Home', path: '/' }]),
    faqSchema(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero />

      <div className="mt-24">
        <TechMarquee />
      </div>

      {/* ------------------------------------------------------- services */}
      <section className="shell py-24 sm:py-28" aria-labelledby="services-heading">
        <Reveal>
          <SectionHead
            path="/services"
            title={
              <span id="services-heading">
                What you can <span className="grad-text">hire me for</span>
              </span>
            }
            lede="Four tracks, each available on its own or as part of an end-to-end build."
          />
        </Reveal>

        <Reveal className="mt-12 grid gap-5 sm:grid-cols-2" stagger={0.1}>
          {site.services.map((s, i) => (
            <ServiceCard key={s.slug} service={s} index={i} />
          ))}
        </Reveal>

        <Reveal className="mt-10">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink transition-colors hover:text-accent-500"
          >
            See how each engagement works <ArrowIcon width={16} height={16} />
          </Link>
        </Reveal>
      </section>

      {/* ---------------------------------------------------------- stack */}
      <section className="shell py-24 sm:py-28" aria-labelledby="stack-heading">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal direction="right">
            <SectionHead
              path="/stack"
              title={
                <span id="stack-heading">
                  The tools I reach for <span className="grad-text">daily</span>
                </span>
              }
              lede="Depth beats breadth. These are the technologies I've shipped production systems with — not a list of everything I've read about."
            />
            <div className="mt-8 flex flex-wrap gap-2">
              {['5+ years shipping', 'Remote-first', 'Asia/Dhaka (UTC+6)'].map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal direction="left" delay={0.1}>
            <StackBars />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------- projects */}
      <section className="shell py-24 sm:py-28" aria-labelledby="projects-heading">
        <Reveal>
          <SectionHead
            path="/projects"
            title={
              <span id="projects-heading">
                Selected <span className="grad-text">projects</span>
              </span>
            }
            lede="A few builds that show how I think about data, concurrency and the parts users never see."
          />
        </Reveal>

        <Reveal className="mt-12 grid gap-5 md:grid-cols-3" stagger={0.12}>
          {site.projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </Reveal>
      </section>

      {/* -------------------------------------------------------- process */}
      <section className="shell py-24 sm:py-28" aria-labelledby="process-heading">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal direction="right">
            <SectionHead
              verb="PATCH"
              path="/process"
              title={
                <span id="process-heading">
                  How a project <span className="grad-text">actually runs</span>
                </span>
              }
              lede="No four-week silences. Work lands on a staging URL you can open every week."
            />
          </Reveal>
          <Reveal direction="left" delay={0.1}>
            <div className="lg:pl-4">
              <ProcessList />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ FAQ */}
      <section className="shell py-24 sm:py-28" aria-labelledby="faq-heading">
        <Reveal>
          <SectionHead
            path="/faq"
            title={
              <span id="faq-heading">
                Questions people <span className="grad-text">ask first</span>
              </span>
            }
          />
        </Reveal>
        <Reveal className="mt-10">
          <Faq />
        </Reveal>
      </section>

      <Reveal className="pb-8">
        <CtaBand />
      </Reveal>
    </>
  );
}
