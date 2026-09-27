// components/ScrambleText.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GLYPHS = "{}[]<>/\\|$#*+=~^&%";

interface ScrambleTextProps {
    text: string;
    className?: string;
    duration?: number;
    triggerOnHover?: boolean;
}

export default function ScrambleText({
    text,
    className = "",
    duration = 550,
    triggerOnHover = true,
}: ScrambleTextProps) {
    const [display, setDisplay] = useState(text);
    const frame = useRef<number>(0);

    const scramble = useCallback(() => {
        if (typeof window === "undefined") return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;

        cancelAnimationFrame(frame.current);
        const start = performance.now();

        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const settled = t * text.length;

            setDisplay(
                text
                    .split("")
                    .map((ch, i) => {
                        // Keep actual spaces intact so words don't jump
                        if (ch === " ") return " ";
                        return i < settled
                            ? ch
                            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                    })
                    .join(""),
            );

            if (t < 1) {
                frame.current = requestAnimationFrame(tick);
            } else {
                setDisplay(text);
            }
        };

        frame.current = requestAnimationFrame(tick);
    }, [text, duration]);

    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    return (
        <span
            className={`inline-block cursor-default select-none tabular-nums ${className}`}
            onPointerEnter={triggerOnHover ? scramble : undefined}
        >
            {/* One copy of the text only. The previous sr-only + aria-hidden
                pair put the same words in the DOM twice, so crawlers read
                headings as "Full-stack Full-stack web developer web developer".
                The scramble is a transient hover effect and settles back to
                the real string, so a single node stays accessible. */}
            <span>{display}</span>
        </span>
    );
}
