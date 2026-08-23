"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import Magnetic from "./Magnetic";
import { CloseIcon, MenuIcon } from "./Icons";

const LINKS = [
    { href: "/", label: "Home", route: "/" },
    { href: "/about", label: "About", route: "/about" },
    { href: "/services", label: "Services", route: "/services" },
    { href: "/projects", label: "Projects", route: "/projects" },
    { href: "/contact", label: "Contact", route: "/contact" },
];

export default function Nav() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // The progress bar is written straight to the DOM instead of through React
        // state — re-rendering the whole header on every scroll frame is the
        // single most common cause of a janky sticky nav.
        const onScroll = () => {
            setScrolled(window.scrollY > 12);
            const max =
                document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
            if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => setOpen(false), [pathname]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) =>
            e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Drawer links come in on a stagger rather than a shared CSS delay, so the
    // list reads top-to-bottom instead of arriving as one slab.
    const drawerRef = useRef<HTMLElement>(null);
    useEffect(() => {
        const el = drawerRef.current;
        if (!el || !open) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                "[data-drawer-item]",
                { autoAlpha: 0, x: -14 },
                {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.5,
                    ease: "expo.out",
                    stagger: 0.05,
                    delay: 0.06,
                },
            );
        }, el);

        return () => ctx.revert();
    }, [open]);

    return (
        <>
            <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-110 focus:rounded-full focus:bg-brand-500 focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
            >
                Skip to content
            </a>

            <header
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
                    scrolled
                        ? "border-b bg-ink/85 backdrop-blur-xl supports-backdrop-filter:bg-ink/72"
                        : "border-b border-transparent"
                }`}
                style={{ transitionTimingFunction: "var(--ease-fluid)" }}
            >
                <nav
                    className="shell flex h-17 items-center justify-between gap-4"
                    aria-label="Primary"
                >
                    <Link
                        href="/"
                        aria-label="wpseemol — Seemol Chakroborti, home"
                        className="shrink-0"
                    >
                        <Logo size="sm" withName />
                    </Link>

                    <ul className="hidden items-center gap-1 md:flex">
                        {LINKS.map((l) => {
                            const active = pathname === l.href;
                            return (
                                <li key={l.href}>
                                    <Link
                                        href={l.href}
                                        aria-current={
                                            active ? "page" : undefined
                                        }
                                        className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                                            active
                                                ? "text-body"
                                                : "text-muted hover:text-body"
                                        }`}
                                    >
                                        {l.label}
                                        <span
                                            className="absolute inset-x-3 -bottom-px h-px origin-left transition-transform duration-500"
                                            style={{
                                                background: "var(--grad)",
                                                transform: active
                                                    ? "scaleX(1)"
                                                    : "scaleX(0)",
                                                transitionTimingFunction:
                                                    "var(--ease-fluid)",
                                            }}
                                        />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {/* The wrapper owns the breakpoint. Putting `hidden` on Magnetic
                itself loses to its own `inline-block`, since both set display
                and the cascade decides by stylesheet order, not class order. */}
                        <span className="hidden sm:inline-block">
                            <Magnetic strength={0.3}>
                                <Link
                                    href="/contact"
                                    className="btn btn-primary px-5! py-2.5!"
                                >
                                    Hire me
                                </Link>
                            </Magnetic>
                        </span>
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            aria-controls="mobile-menu"
                            aria-label={open ? "Close menu" : "Open menu"}
                            className="grid h-10 w-10 place-items-center rounded-full border bg-elev/70 backdrop-blur-sm md:hidden"
                        >
                            {open ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </nav>

                {/* Reading progress — doubles as the header's bottom rule. */}
                <div
                    ref={barRef}
                    className="h-px origin-left scale-x-0"
                    style={{ background: "var(--grad)" }}
                />
            </header>

            {/* Mobile drawer */}
            <div
                id="mobile-menu"
                className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`}
                aria-hidden={!open}
            >
                <div
                    onClick={() => setOpen(false)}
                    className={`absolute inset-0 bg-ink/70 backdrop-blur-md transition-opacity duration-300 ${
                        open ? "opacity-100" : "opacity-0"
                    }`}
                />
                <nav
                    ref={drawerRef}
                    className={`absolute inset-x-0 top-17 border-b bg-elev/95 px-5 pt-4 pb-7 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
                        open
                            ? "translate-y-0 opacity-100"
                            : "-translate-y-4 opacity-0"
                    }`}
                    style={{ transitionTimingFunction: "var(--ease-fluid)" }}
                    aria-label="Mobile"
                >
                    <ul className="flex flex-col">
                        {LINKS.map((l) => (
                            <li key={l.href} data-drawer-item>
                                <Link
                                    href={l.href}
                                    className="flex items-center justify-between border-b py-3.5 text-lg font-semibold last:border-0"
                                >
                                    {l.label}
                                    <span className="font-mono text-2xs text-muted">
                                        {l.route}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link
                        href="/contact"
                        className="btn btn-primary mt-6 w-full"
                        data-drawer-item
                    >
                        Hire me
                    </Link>
                </nav>
            </div>
        </>
    );
}
