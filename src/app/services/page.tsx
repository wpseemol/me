import type { Metadata } from "next";
import Link from "next/link";
import site from "@/data/site.json";
import {
    abs,
    breadcrumbSchema,
    graph,
    pageMetadata,
    servicesSchema,
    webPageSchema,
} from "@/lib/seo";

import Reveal from "@/components/Reveal";
import { RouteLabel, SectionHead } from "@/components/Section";
import { CtaBand, ProcessList } from "@/components/Blocks";
import { ArrowIcon, CheckIcon } from "@/components/Icons";
import ScrambleText from "@/components/ScrambleText";

export const metadata: Metadata = pageMetadata("services");

export default function ServicesPage() {
    const jsonLd = graph([
        webPageSchema("services"),
        ...servicesSchema(),
        breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
        ]),
        {
            "@type": "CollectionPage",
            url: abs("/services"),
            name: "Web development services by Seemol Chakroborti",
            description: site.services.map((s) => s.title).join(" · "),
        },
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <section className="shell pt-32 sm:pt-40">
                <Reveal>
                    <SectionHead
                        as="h1"
                        path="/services"
                        title={
                            <>
                                <ScrambleText
                                    text="Services you can"
                                    duration={500}
                                />{" "}
                                <span className="grad-text">
                                    <ScrambleText text="buy" duration={600} />
                                </span>
                            </>
                        }
                        lede="Four tracks. Take one on its own, or combine them into an end-to-end build. Every engagement starts with a written scope — deliverables, timeline and price — before any code is written."
                    />
                </Reveal>

                <Reveal className="mt-8 flex flex-wrap gap-2" stagger={0.06}>
                    {site.services.map((s) => (
                        <a
                            key={s.slug}
                            href={`#${s.slug}`}
                            className="chip transition-colors hover:text-body"
                        >
                            {s.stack[0]}
                        </a>
                    ))}
                </Reveal>
            </section>

            {/* Each service gets a full-width slab rather than a card — these are the
          page's actual content, not a summary grid. */}
            <div className="mt-20 space-y-5">
                {site.services.map((s, i) => (
                    <Reveal key={s.slug} className="shell">
                        <article
                            id={s.slug}
                            className="card scroll-mt-24 overflow-hidden p-7 sm:p-10"
                        >
                            <div className="grid gap-9 lg:grid-cols-[1fr_0.85fr] lg:gap-14">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] font-mono text-sm font-bold text-white"
                                            style={{
                                                background: `linear-gradient(${130 + i * 22}deg,var(--brand-600), var(--accent-400))`,
                                            }}
                                        >
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <RouteLabel
                                            verb="GET"
                                            path={`/services/${s.slug}`}
                                        />
                                    </div>

                                    <h2 className="mt-5 text-[clamp(1.5rem,3.2vw,2.15rem)]">
                                        {s.title}
                                    </h2>
                                    <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted sm:text-base">
                                        {s.summary}
                                    </p>
                                    <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted sm:text-base">
                                        {s.detail}
                                    </p>

                                    <div className="mt-7 flex flex-wrap gap-1.5">
                                        {s.stack.map((t) => (
                                            <span key={t} className="chip">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-card border bg-surface/60 p-6">
                                    <h3 className="font-mono text-2xs uppercase tracking-[0.18em] text-muted">
                                        What you get
                                    </h3>
                                    <ul className="mt-5 space-y-3">
                                        {s.deliverables.map((d) => (
                                            <li
                                                key={d}
                                                className="flex items-start gap-2.5 text-sm leading-relaxed"
                                            >
                                                <CheckIcon
                                                    width={15}
                                                    height={15}
                                                    className="mt-1 shrink-0 text-brand-ink"
                                                />
                                                <span>{d}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href={`/contact?service=${s.slug}`}
                                        className="mt-7 inline-flex items-center gap-1.5 border-t pt-5 text-sm font-semibold text-brand-ink transition-colors hover:text-accent-500"
                                    >
                                        Ask about this{" "}
                                        <ArrowIcon width={15} height={15} />
                                    </Link>
                                </div>
                            </div>
                        </article>
                    </Reveal>
                ))}
            </div>

            <section className="shell py-24 sm:py-28">
                <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
                    <Reveal direction="right">
                        <SectionHead
                            verb="PATCH"
                            path="/process"
                            title={
                                <>
                                    {" "}
                                    <ScrambleText
                                        text="What working together looks like"
                                        duration={500}
                                    />
                                </>
                            }
                            lede="The same five stages regardless of which service you pick."
                        />
                    </Reveal>
                    <Reveal direction="left" delay={0.1}>
                        <div className="lg:pl-4">
                            <ProcessList />
                        </div>
                    </Reveal>
                </div>
            </section>

            <Reveal className="pb-8">
                <CtaBand />
            </Reveal>
        </>
    );
}
