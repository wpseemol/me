"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import site from "@/data/site.json";
import { asset } from "@/lib/asset";
import { introDone } from "@/lib/intro";
import { LoadIn, MaskReveal, SplitReveal } from "./Reveal";
import { StatCounter } from "./Section";
import Magnetic from "./Magnetic";
import { ArrowIcon, ArrowUpRightIcon } from "./Icons";
import ScrambleText from "./ScrambleText";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

type Token = { t: string; v: string };

const TOKEN_CLASS: Record<string, string> = {
    kw: "text-[#7DA2FF]",
    var: "text-[#43E4FF]",
    prop: "text-[#8CE8D0]",
    str: "text-[#FFCF8B]",
    fn: "text-[#85A6FF]",
    plain: "text-slate-400",
};

/** Types the snippet out character by character, once the intro clears. */
function CodeCard() {
    const lines = site.codeSnippet.lines as Token[][];
    const total = lines.reduce(
        (sum, l) => sum + l.reduce((s, t) => s + t.v.length, 0) + 1,
        0,
    );
    const [typed, setTyped] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setTyped(total);
            return;
        }

        let tween: gsap.core.Tween | undefined;
        let cancelled = false;

        introDone.then(() => {
            if (cancelled) return;
            const obj = { n: 0 };
            tween = gsap.to(obj, {
                n: total,
                duration: 3.2,
                delay: 0.5,
                ease: "none",
                onUpdate: () => setTyped(Math.floor(obj.n)),
            });
        });

        return () => {
            cancelled = true;
            tween?.kill();
        };
    }, [total]);

    // Pointer tilt, plus a slow counter-rotation on scroll so the card feels
    // like an object in the page rather than a picture of one.
    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        const ctx = gsap.context(() => {
            gsap.to(el, {
                yPercent: -9,
                ease: "none",
                scrollTrigger: {
                    trigger: el,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.6,
                },
            });
        }, el);

        if (window.matchMedia("(hover: none)").matches)
            return () => ctx.revert();

        const rotX = gsap.quickTo(el, "rotateX", {
            duration: 0.7,
            ease: "power3.out",
        });
        const rotY = gsap.quickTo(el, "rotateY", {
            duration: 0.7,
            ease: "power3.out",
        });

        const onMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            rotY(((e.clientX - r.left) / r.width - 0.5) * 10);
            rotX(-((e.clientY - r.top) / r.height - 0.5) * 10);
        };
        const onLeave = () => {
            rotX(0);
            rotY(0);
        };

        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
            el.removeEventListener("pointermove", onMove);
            el.removeEventListener("pointerleave", onLeave);
            ctx.revert();
        };
    }, []);

    let consumed = 0;
    const done = typed >= total;

    return (
        <div
            ref={cardRef}
            className="card overflow-hidden bg-[#060A16]/92! shadow-[0_30px_80px_-40px_rgb(var(--c-glow-a)/0.9)]"
            style={{ transformStyle: "preserve-3d", perspective: 900 }}
        >
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 font-mono text-2xs text-slate-500">
                    seemol.config.ts
                </span>
            </div>

            <pre className="overflow-x-auto px-4 py-5 font-mono text-[12px] leading-[1.75] sm:text-[13px]">
                <code>
                    <span className="text-slate-600">
                        {site.codeSnippet.comment}
                    </span>
                    {"\n"}
                    {lines.map((line, li) => {
                        const rendered = line.map((tok, ti) => {
                            const start = consumed;
                            consumed += tok.v.length;
                            const take = Math.max(
                                0,
                                Math.min(tok.v.length, typed - start),
                            );
                            if (take <= 0) return null;
                            return (
                                <span
                                    key={ti}
                                    className={
                                        TOKEN_CLASS[tok.t] ?? TOKEN_CLASS.plain
                                    }
                                >
                                    {tok.v.slice(0, take)}
                                </span>
                            );
                        });
                        consumed += 1; // newline
                        return (
                            <span key={li}>
                                {rendered}
                                {"\n"}
                            </span>
                        );
                    })}
                    <span
                        className={`inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-accent-400 ${
                            done ? "animate-caret" : ""
                        }`}
                    />
                </code>
            </pre>
        </div>
    );
}

export default function Hero() {
    const p = site.profile;
    const portraitRef = useRef<HTMLDivElement>(null);

    // Portrait drifts up faster than the page, the classic depth cue.
    useEffect(() => {
        const el = portraitRef.current;
        if (!el) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        const ctx = gsap.context(() => {
            gsap.to(el, {
                yPercent: -18,
                ease: "none",
                scrollTrigger: {
                    trigger: el,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.8,
                },
            });
        }, el);

        return () => ctx.revert();
    }, []);

    return (
        <section
            className="relative pt-32 sm:pt-40"
            aria-labelledby="hero-heading"
        >
            <div className="shell">
                <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                    {/* ---------------------------------------------- copy column */}
                    <div>
                        <LoadIn>
                            <span className="inline-flex items-center gap-2.5 rounded-full border bg-elev/60 px-3.5 py-1.5 font-mono text-2xs uppercase tracking-[0.14em] text-muted backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-signal" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
                                </span>
                                {p.availability}
                            </span>
                        </LoadIn>

                        <h1
                            id="hero-heading"
                            className="mt-6 text-[clamp(2.6rem,7.4vw,4.6rem)] leading-[0.98]"
                        >
                            <SplitReveal
                                as="span"
                                className="block"
                                type="words"
                                onLoad
                                delay={0.1}
                            >
                                <ScrambleText text="Full-stack" />
                            </SplitReveal>

                            <MaskReveal
                                as="span"
                                className="grad-text block"
                                onLoad
                                delay={0.26}
                            >
                                <ScrambleText
                                    text="web developer"
                                    duration={700}
                                />
                            </MaskReveal>
                        </h1>

                        <LoadIn delay={0.42}>
                            <p className="mt-4 font-mono text-sm text-muted sm:text-[15px]">
                                Laravel <span className="opacity-40">·</span>{" "}
                                MERN <span className="opacity-40">·</span>{" "}
                                Next.js <span className="opacity-40">·</span>{" "}
                                Shopify
                            </p>
                        </LoadIn>

                        <SplitReveal
                            as="p"
                            className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted sm:text-[17px]"
                            onLoad
                            delay={0.5}
                        >
                            I&apos;m Seemol Chakroborti — I architect enterprise
                            backends with Laravel, high-performance frontends
                            with Next.js, and full-stack MERN applications that
                            scale.
                        </SplitReveal>

                        <LoadIn
                            className="mt-8 flex flex-wrap gap-3"
                            delay={0.62}
                            stagger={0.08}
                        >
                            <Magnetic strength={0.32}>
                                <Link
                                    href="/contact"
                                    className="btn btn-primary"
                                >
                                    Hire me <ArrowIcon width={17} height={17} />
                                </Link>
                            </Magnetic>
                            <Magnetic strength={0.32}>
                                <Link
                                    href="/projects"
                                    className="btn btn-ghost"
                                >
                                    View work{" "}
                                    <ArrowUpRightIcon width={16} height={16} />
                                </Link>
                            </Magnetic>
                        </LoadIn>

                        <LoadIn delay={0.78}>
                            {/* Tells people the background is a thing they can touch. */}
                            <p className="mt-6 font-mono text-2xs text-muted/70">
                                <span className="text-brand-ink">{"//"}</span>{" "}
                                move the cursor to push the field — hold to pull
                                it back
                            </p>
                        </LoadIn>

                        <LoadIn
                            className="mt-10 grid max-w-md grid-cols-3 gap-x-4 gap-y-6 border-t pt-8 sm:gap-x-6"
                            delay={0.86}
                            stagger={0.09}
                        >
                            {site.stats.map((s) => (
                                <StatCounter
                                    key={s.label}
                                    value={s.value}
                                    suffix={s.suffix}
                                    label={s.label}
                                />
                            ))}
                        </LoadIn>
                    </div>

                    {/* ---------------------------------------------- visual column */}
                    <LoadIn className="relative" delay={0.3}>
                        <div className="relative mx-auto max-w-md">
                            <div
                                ref={portraitRef}
                                className="relative ml-auto w-[62%] animate-floaty"
                            >
                                <div
                                    className="absolute -inset-3 rounded-[28px] opacity-70 blur-2xl"
                                    style={{ background: "var(--grad)" }}
                                />
                                <div className="relative overflow-hidden rounded-[22px] border">
                                    <Image
                                        src={asset(p.portraitMono)}
                                        alt={p.portraitMonoAlt}
                                        width={520}
                                        height={520}
                                        priority
                                        sizes="(max-width: 1024px) 45vw, 300px"
                                        className="h-auto w-full object-cover"
                                    />
                                    <div
                                        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
                                        style={{
                                            background:
                                                "linear-gradient(150deg, var(--brand-500), transparent 55%, var(--accent-400))",
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="relative -mt-16 w-[86%] sm:-mt-20">
                                <CodeCard />
                            </div>
                        </div>
                    </LoadIn>
                </div>
            </div>
        </section>
    );
}
