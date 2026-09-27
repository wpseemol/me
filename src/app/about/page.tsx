import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import site from "@/data/site.json";
import {
    abs,
    breadcrumbSchema,
    graph,
    pageMetadata,
    personSchema,
    webPageSchema,
} from "@/lib/seo";

import Reveal from "@/components/Reveal";
import { SectionHead, StatCounter } from "@/components/Section";
import { CtaBand, ProcessList, StackBars } from "@/components/Blocks";
import { ArrowIcon } from "@/components/Icons";
import ScrambleText from "@/components/ScrambleText";

export const metadata: Metadata = pageMetadata("about");

export default function AboutPage() {
    const p = site.profile;

    const jsonLd = graph([
        personSchema(),
        webPageSchema("about"),
        breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
        ]),
        {
            "@type": "AboutPage",
            url: abs("/about"),
            name: "About Seemol Chakroborti",
            description: p.longBio,
            primaryImageOfPage: {
                "@type": "ImageObject",
                url: abs(p.portrait),
                caption: p.portraitAlt,
            },
        },
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <section className="shell pt-32 sm:pt-40">
                <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
                    <Reveal>
                        <SectionHead
                            as="h1"
                            path="/about"
                            title={
                                <>
                                    <ScrambleText
                                        text="Hi, I'm"
                                        duration={500}
                                    />
                                    <span className="grad-text">
                                        <ScrambleText
                                            text="Seemol Chakroborti"
                                            duration={600}
                                        />
                                    </span>
                                </>
                            }
                        />
                        <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-muted sm:text-[17px]">
                            {p.longBio}
                        </p>
                        <p className="mt-5 max-w-prose text-[15px] leading-relaxed text-muted sm:text-[17px]">
                            Most of my work sits at the seam between an
                            ambitious idea and the constraints of a real budget.
                            That usually means picking the boring,
                            well-understood tool over the exciting one, writing
                            down why, and leaving the codebase in a state where
                            the next developer isn&apos;t afraid to touch it.
                        </p>

                        <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-5 border-t pt-8 sm:grid-cols-3">
                            {[
                                {
                                    k: "Based in",
                                    v: `${p.location.city}, ${p.location.country}`,
                                },
                                { k: "Timezone", v: "Asia/Dhaka (UTC+6)" },
                                { k: "Languages", v: p.languages.join(", ") },
                                { k: "Availability", v: p.availability },
                                { k: "Works", v: "Remote, worldwide" },
                                { k: "Email", v: p.email },
                            ].map((row) => (
                                <div key={row.k}>
                                    <dt className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
                                        {row.k}
                                    </dt>
                                    <dd className="mt-1.5 text-sm font-medium">
                                        {row.v}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link href="/contact" className="btn btn-primary">
                                Work with me{" "}
                                <ArrowIcon width={17} height={17} />
                            </Link>
                            <Link href="/projects" className="btn btn-ghost">
                                See the work
                            </Link>
                        </div>
                    </Reveal>

                    <Reveal direction="left" delay={0.12}>
                        <figure className="relative mx-auto max-w-sm">
                            <div
                                className="absolute -inset-4 rounded-[30px] opacity-60 blur-2xl"
                                style={{ background: "var(--grad)" }}
                            />
                            <div className="relative overflow-hidden rounded-3xl border">
                                <Image
                                    src={p.portrait}
                                    alt={p.portraitAlt}
                                    width={640}
                                    height={640}
                                    priority
                                    sizes="(max-width: 1024px) 80vw, 380px"
                                    className="h-auto w-full object-cover"
                                />
                            </div>
                            <figcaption className="mt-4 text-center font-mono text-2xs uppercase tracking-[0.14em] text-muted">
                                Seemol Chakroborti · wpseemol
                            </figcaption>
                        </figure>

                        <div className="mt-10 grid grid-cols-3 gap-x-4 gap-y-5 border-t pt-8 sm:gap-x-5">
                            {site.stats.map((s) => (
                                <StatCounter
                                    key={s.label}
                                    value={s.value}
                                    suffix={s.suffix}
                                    label={s.label}
                                />
                            ))}
                        </div>
                    </Reveal>
                </div>
            </section>

            <section className="shell py-24 sm:py-28">
                <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
                    <Reveal direction="right">
                        <SectionHead
                            verb="PATCH"
                            path="/process"
                            title={
                                <>
                                    <ScrambleText
                                        text="How I run a build"
                                        duration={500}
                                    />{" "}
                                </>
                            }
                            lede="Five stages, every project, whether it's a two-week fix or a six-month platform."
                        />
                    </Reveal>
                    <Reveal direction="left" delay={0.1}>
                        <div className="lg:pl-4">
                            <ProcessList />
                        </div>
                    </Reveal>
                </div>
            </section>

            <section className="shell py-24 sm:py-28">
                <Reveal>
                    <SectionHead
                        path="/stack"
                        title={
                            <>
                                <ScrambleText text="Technical" duration={500} />{" "}
                                <span className="grad-text">
                                    <ScrambleText text="stack" duration={600} />
                                </span>
                            </>
                        }
                        lede="Rated by what I've actually shipped and maintained, not by what I've tried once."
                    />
                </Reveal>
                <Reveal className="mt-11">
                    <StackBars />
                </Reveal>
            </section>

            <Reveal className="pb-8">
                <CtaBand />
            </Reveal>
        </>
    );
}
