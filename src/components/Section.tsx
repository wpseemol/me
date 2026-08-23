"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

/**
 * The site's structural device: each section announces itself as an API
 * endpoint. It's not decoration — the verb encodes what the section does
 * (GET = here's information, POST = here's where you send something).
 */
export function RouteLabel({
    verb = "GET",
    path,
    className = "",
}: {
    verb?: "GET" | "POST" | "PATCH";
    path: string;
    className?: string;
}) {
    return (
        <span className={`route-label ${className}`}>
            <span className="verb">{verb}</span>
            <span>{path}</span>
        </span>
    );
}

export function SectionHead({
    verb,
    path,
    title,
    lede,
    align = "left",
}: {
    verb?: "GET" | "POST" | "PATCH";
    path: string;
    title: ReactNode;
    lede?: ReactNode;
    align?: "left" | "center";
}) {
    return (
        <div
            className={
                align === "center"
                    ? "mx-auto max-w-2xl text-center"
                    : "max-w-2xl"
            }
        >
            <RouteLabel verb={verb} path={path} />
            <h2 className="mt-4 text-[clamp(1.9rem,4.4vw,3.05rem)]">{title}</h2>
            {lede ? (
                <p
                    data-speakable
                    className="mt-4 text-[15px] leading-relaxed text-muted sm:text-base"
                >
                    {lede}
                </p>
            ) : null}
        </div>
    );
}

/** Counts up once when scrolled into view. */
export function StatCounter({
    value,
    suffix = "",
    label,
}: {
    value: number;
    suffix?: string;
    label: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const [shown, setShown] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setShown(value);
            return;
        }

        const obj = { n: 0 };
        const ctx = gsap.context(() => {
            gsap.to(obj, {
                n: value,
                duration: 1.5,
                ease: "power2.out",
                onUpdate: () => setShown(Math.round(obj.n)),
                scrollTrigger: { trigger: el, start: "top 92%", once: true },
            });
        }, el);

        return () => ctx.revert();
    }, [value]);

    return (
        <div className="min-w-0">
            <span
                ref={ref}
                className="block font-display text-[clamp(2rem,5vw,2.9rem)] font-extrabold leading-none tabular-nums grad-text"
            >
                {shown}
                {suffix}
            </span>
            {/* Three of these sit in a ~100px column on a phone, and "Happy clients"
          is the one that does not fit. Drop a point and tighten the tracking
          below sm rather than letting it run past the grid. */}
            <span className="mt-2 block font-mono text-[10px] uppercase tracking-widest text-muted sm:text-2xs sm:tracking-[0.14em]">
                {label}
            </span>
        </div>
    );
}
