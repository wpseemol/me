import type { Metadata } from "next";
import site from "@/data/site.json";
import {
    abs,
    breadcrumbSchema,
    graph,
    pageMetadata,
    projectsSchema,
    webPageSchema,
} from "@/lib/seo";

import Reveal from "@/components/Reveal";
import { SectionHead } from "@/components/Section";
import { CtaBand, ProjectCard, TechMarquee } from "@/components/Blocks";
import { ArrowUpRightIcon, GithubIcon } from "@/components/Icons";
import ScrambleText from "@/components/ScrambleText";

export const metadata: Metadata = pageMetadata("projects");

export default function ProjectsPage() {
    const jsonLd = graph([
        webPageSchema("projects"),
        projectsSchema(),
        breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
        ]),
        {
            "@type": "CollectionPage",
            url: abs("/projects"),
            name: "Projects by Seemol Chakroborti",
            description: site.projects.map((p) => p.name).join(" · "),
        },
    ]);

    const github = site.socials.find((s) => s.icon === "github")?.url ?? "#";

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
                        path="/projects"
                        title={
                            <>
                                <ScrambleText
                                    text="Things I've"
                                    duration={500}
                                />
                                <span className="grad-text">
                                    <ScrambleText text="built" duration={600} />
                                </span>
                            </>
                        }
                        lede="Each of these solved a specific problem. The notes below focus on the interesting decision in each one rather than the feature list."
                    />
                </Reveal>

                <Reveal className="mt-8">
                    <a
                        href={github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                    >
                        <GithubIcon width={17} height={17} />
                        More on GitHub
                        <ArrowUpRightIcon width={15} height={15} />
                    </a>
                </Reveal>

                <Reveal
                    className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                    stagger={0.12}
                >
                    {site.projects.map((p) => (
                        <ProjectCard key={p.slug} project={p} />
                    ))}
                </Reveal>
            </section>

            {/* Deep-dive slabs: one paragraph of real engineering detail per build. */}
            <section
                className="shell py-24 sm:py-28"
                aria-labelledby="notes-heading"
            >
                <Reveal>
                    <SectionHead
                        path="/projects/notes"
                        title={
                            <span id="notes-heading">
                                <ScrambleText text="Build" duration={500} />
                                <span className="grad-text">
                                    <ScrambleText text="notes" duration={600} />
                                </span>
                            </span>
                        }
                        lede="The part of a project that's worth talking about is rarely the UI."
                    />
                </Reveal>

                <Reveal className="mt-12 divide-y border-y" stagger={0.1}>
                    {site.projects.map((p) => (
                        <div
                            key={p.slug}
                            className="grid gap-5 py-8 sm:grid-cols-[0.6fr_1.4fr] sm:gap-10"
                        >
                            <div>
                                <h3 className="text-lg">{p.name}</h3>
                                <p className="mt-2 font-mono text-2xs uppercase tracking-[0.14em] text-muted">
                                    {p.language} · {p.year}
                                </p>
                            </div>
                            <div>
                                <p className="max-w-prose text-sm leading-relaxed text-muted">
                                    {p.detail}
                                </p>
                                <a
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink transition-colors hover:text-accent-500"
                                >
                                    Source{" "}
                                    <ArrowUpRightIcon width={14} height={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </Reveal>
            </section>

            <TechMarquee />

            <Reveal className="pt-24 pb-8 sm:pt-28">
                <CtaBand />
            </Reveal>
        </>
    );
}
