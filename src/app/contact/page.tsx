import type { Metadata } from "next";
import { Suspense } from "react";
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
import { SectionHead } from "@/components/Section";
import ContactForm from "@/components/ContactForm";
import { Faq } from "@/components/Blocks";
import { SOCIAL_ICONS } from "@/components/Icons";
import ScrambleText from "@/components/ScrambleText";

export const metadata: Metadata = pageMetadata("contact");

export default function ContactPage() {
    const p = site.profile;

    const jsonLd = graph([
        personSchema(),
        webPageSchema("contact"),
        breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
        ]),
        {
            "@type": "ContactPage",
            url: abs("/contact"),
            name: "Contact Seemol Chakroborti",
            description: `Hire Seemol Chakroborti (wpseemol) for freelance or full-time web development. Email ${p.email}.`,
            mainEntity: {
                "@type": "ContactPoint",
                contactType: "Business enquiries",
                email: p.email,
                availableLanguage: p.languages,
                areaServed: "Worldwide",
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
                <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
                    <Reveal direction="right">
                        <SectionHead
                            as="h1"
                            verb="POST"
                            path="/contact"
                            title={
                                <>
                                    <ScrambleText
                                        text="Let's build"
                                        duration={500}
                                    />{" "}
                                    <span className="grad-text">
                                        {" "}
                                        <ScrambleText
                                            text="together"
                                            duration={600}
                                        />
                                    </span>
                                </>
                            }
                            lede="Tell me what the product has to do and where it's stuck. You'll get a written scope back — deliverables, timeline and price — before anyone writes code."
                        />

                        <div className="mt-9 space-y-5 border-t pt-8">
                            <div>
                                <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
                                    Email
                                </p>
                                <a
                                    href={`mailto:${p.email}`}
                                    className="mt-1.5 block text-base font-semibold transition-colors hover:text-brand-ink"
                                >
                                    {p.email}
                                </a>
                            </div>
                            <div>
                                <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
                                    Based in
                                </p>
                                <p className="mt-1.5 text-base font-semibold">
                                    {p.location.city}, {p.location.country} ·
                                    UTC+6
                                </p>
                            </div>
                            <div>
                                <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
                                    Response time
                                </p>
                                <p className="mt-1.5 text-base font-semibold">
                                    Within one working day
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-2">
                            {site.socials.map((s) => {
                                const Icon = SOCIAL_ICONS[s.icon];
                                return (
                                    <a
                                        key={s.name}
                                        href={s.url}
                                        target={
                                            s.icon === "mail"
                                                ? undefined
                                                : "_blank"
                                        }
                                        rel={
                                            s.icon === "mail"
                                                ? undefined
                                                : "noopener noreferrer me"
                                        }
                                        aria-label={`${p.name} on ${s.name}`}
                                        className="grid h-11 w-11 place-items-center rounded-full border text-muted transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-500/50 hover:text-body"
                                    >
                                        {Icon ? (
                                            <Icon width={18} height={18} />
                                        ) : null}
                                    </a>
                                );
                            })}
                        </div>
                    </Reveal>

                    <Reveal direction="left" delay={0.1}>
                        <Suspense
                            fallback={
                                <div
                                    className="card h-130 animate-pulse p-6"
                                    aria-hidden="true"
                                />
                            }
                        >
                            <ContactForm />
                        </Suspense>
                    </Reveal>
                </div>
            </section>

            <section
                className="shell py-24 sm:py-28"
                aria-labelledby="contact-faq"
            >
                <Reveal>
                    <SectionHead
                        path="/faq"
                        title={
                            <span id="contact-faq">
                                <ScrambleText
                                    text="Before you"
                                    duration={500}
                                />{" "}
                                <span className="grad-text">
                                    <ScrambleText text="write" duration={500} />
                                </span>
                            </span>
                        }
                    />
                </Reveal>
                <Reveal className="mt-10 pb-8">
                    <Faq />
                </Reveal>
            </section>
        </>
    );
}
