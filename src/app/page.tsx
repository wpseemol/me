import Link from "next/link";
import type { Metadata } from "next";
import site from "@/data/site.json";
import {
    breadcrumbSchema,
    faqSchema,
    graph,
    pageMetadata,
    profilePageSchema,
    webPageSchema,
} from "@/lib/seo";
import {
    getProjectsConfig,
    getWorkingProjects,
} from "@/lib/working-projects";

import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import { SectionHead } from "@/components/Section";
import {
    CtaBand,
    Faq,
    ProcessList,
    ProjectCard,
    ServiceCard,
    TechMarquee,
} from "@/components/Blocks";
import WorkingProjectStage from "@/components/WorkingProjectStage";
import SkillsStage from "@/components/SkillsStage";
import { ArrowIcon } from "@/components/Icons";
import ScrambleText from "@/components/ScrambleText";

export const metadata: Metadata = pageMetadata("home");

export default function HomePage() {
    const { homeLimit, home } = getProjectsConfig();
    const working = getWorkingProjects({
        featuredOnly: true,
        order: home.length ? home : undefined,
        limit: homeLimit || undefined,
    });

    const jsonLd = graph([
        webPageSchema("home"),
        profilePageSchema(),
        breadcrumbSchema([{ name: "Home", path: "/" }]),
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

            {/* --------------------------------------------- recent / live work */}
            {working.length > 0 ? (
                <section
                    className="py-6 sm:py-8"
                    aria-labelledby="working-heading"
                >
                    <div className="shell pb-2 text-center">
                        <Reveal>
                            <SectionHead
                                align="center"
                                path="/projects"
                                title={
                                    <span id="working-heading">
                                        <ScrambleText
                                            text="Recent"
                                            duration={500}
                                        />{" "}
                                        <span className="grad-text">
                                            <ScrambleText
                                                text="working projects"
                                                duration={600}
                                            />
                                        </span>
                                    </span>
                                }
                            />
                        </Reveal>
                    </div>
                    <WorkingProjectStage projects={working} />
                    <Reveal className="shell mt-8 flex justify-center sm:mt-10">
                        <Link href="/projects" className="btn btn-ghost">
                            All projects
                            <ArrowIcon width={16} height={16} />
                        </Link>
                    </Reveal>
                </section>
            ) : null}

            {/* ------------------------------------------------------- services */}
            <section
                className="shell py-24 sm:py-28"
                aria-labelledby="services-heading"
            >
                <Reveal>
                    <SectionHead
                        path="/services"
                        title={
                            <span id="services-heading">
                                <ScrambleText
                                    text="What you can"
                                    duration={500}
                                />{" "}
                                <span className="grad-text">
                                    <ScrambleText
                                        text="hire me for"
                                        duration={600}
                                    />
                                </span>
                            </span>
                        }
                        lede="Four tracks, each available on its own or as part of an end-to-end build."
                    />
                </Reveal>

                <Reveal
                    className="mt-12 grid gap-5 sm:grid-cols-2"
                    stagger={0.1}
                >
                    {site.services.map((s, i) => (
                        <ServiceCard key={s.slug} service={s} index={i} />
                    ))}
                </Reveal>

                <Reveal className="mt-10">
                    <Link
                        href="/services"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink transition-colors hover:text-accent-500"
                    >
                        See how each engagement works{" "}
                        <ArrowIcon width={16} height={16} />
                    </Link>
                </Reveal>
            </section>

            {/* ---------------------------------------------------------- stack */}
            <SkillsStage />

            {/* ------------------------------------------------------- projects */}
            <section
                className="shell py-24 sm:py-28"
                aria-labelledby="projects-heading"
            >
                <Reveal>
                    <SectionHead
                        path="/projects"
                        title={
                            <span id="projects-heading">
                                <ScrambleText text="Selected" duration={500} />
                                <span className="grad-text">
                                    {" "}
                                    <ScrambleText
                                        text="projects"
                                        duration={600}
                                    />
                                </span>
                            </span>
                        }
                        lede="A few builds that show how I think about data, concurrency and the parts users never see."
                    />
                </Reveal>

                <Reveal
                    className="mt-12 grid gap-5 md:grid-cols-3"
                    stagger={0.12}
                >
                    {site.projects.map((p) => (
                        <ProjectCard key={p.slug} project={p} />
                    ))}
                </Reveal>
            </section>

            {/* -------------------------------------------------------- process */}
            <section
                className="shell py-24 sm:py-28"
                aria-labelledby="process-heading"
            >
                <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
                    {/* Sticky outside Reveal — transforms on Reveal would kill sticky. */}
                    <div className="lg:sticky lg:top-28 lg:self-start">
                        <Reveal direction="right">
                            <SectionHead
                                verb="PATCH"
                                path="/process"
                                title={
                                    <span id="process-heading">
                                        <ScrambleText
                                            text="How a project"
                                            duration={500}
                                        />{" "}
                                        <span className="grad-text">
                                            <ScrambleText
                                                text="actually runs"
                                                duration={600}
                                            />
                                        </span>
                                    </span>
                                }
                                lede="No four-week silences. Work lands on a staging URL you can open every week."
                            />
                        </Reveal>
                    </div>
                    <Reveal direction="left" delay={0.1}>
                        <div className="lg:pl-4">
                            <ProcessList />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ------------------------------------------------------------ FAQ */}
            <section
                className="shell py-24 sm:py-28"
                aria-labelledby="faq-heading"
            >
                <Reveal>
                    <SectionHead
                        path="/faq"
                        title={
                            <span id="faq-heading">
                                <ScrambleText
                                    text="Questions people"
                                    duration={500}
                                />{" "}
                                <span className="grad-text">
                                    <ScrambleText
                                        text="ask first"
                                        duration={500}
                                    />
                                </span>
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
