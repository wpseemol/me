"use client";

import type { SheetContent } from "./skillsData";
import { SKILL_ACCENT, SKILL_ICON } from "@/components/ui/SkillIcons";

type BookPageProps = {
  front: SheetContent;
  back: SheetContent;
  /** Higher = later in the stack (under earlier sheets while unturned). */
  stackIndex: number;
  sheetCount: number;
};

/**
 * One double-sided leaf hinged on the spine (right half only).
 * GSAP owns rotateY — this markup stays static.
 */
export default function BookPage({
  front,
  back,
  stackIndex,
  sheetCount,
}: BookPageProps) {
  return (
    <div
      data-book-sheet
      data-sheet-index={stackIndex}
      className="book-sheet pointer-events-none absolute inset-y-0 left-1/2 w-1/2 will-change-transform"
      style={{
        transformOrigin: "left center",
        transformStyle: "preserve-3d",
        zIndex: sheetCount - stackIndex + 20,
      }}
    >
      <div
        className="book-page book-sheet-face book-sheet-face--front absolute inset-0 overflow-hidden rounded-r-xl border border-l-0"
        style={{
          boxShadow:
            "8px 16px 36px -16px rgb(0 0 0 / 0.45), inset 10px 0 18px rgb(0 0 0 / 0.04)",
        }}
      >
        <PageFace content={front} side="right" />
        <div aria-hidden className="book-sheet-shade" data-sheet-shade />
        <div aria-hidden className="book-sheet-curl" data-sheet-curl />
      </div>

      <div
        className="book-page-back book-sheet-face book-sheet-face--back absolute inset-0 overflow-hidden rounded-l-xl border"
        style={{
          boxShadow: "inset -10px 0 20px rgb(0 0 0 / 0.08)",
        }}
      >
        <PageFace content={back} side="left" verso />
      </div>
    </div>
  );
}

export function PageFace({
  content,
  side,
  verso = false,
}: {
  content: SheetContent;
  side: "left" | "right";
  verso?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden p-5 sm:p-7 md:p-8 ${
        side === "left" ? "rounded-l-xl" : "rounded-r-xl"
      }`}
    >
      {content.kind === "intro" && <IntroFace content={content} />}
      {content.kind === "group" && <GroupFace content={content} />}
      {content.kind === "skill" && (
        <SkillFace content={content} compact={verso} />
      )}
      {content.kind === "notes" && <NotesFace content={content} />}
    </div>
  );
}

function GroupFace({
  content,
}: {
  content: Extract<SheetContent, { kind: "group" }>;
}) {
  return (
    <>
      <p className="book-muted shrink-0 font-mono text-[10px] uppercase tracking-[0.18em]">
        Chapter
      </p>
      <h3 className="book-ink mt-3 shrink-0 font-display text-xl leading-tight sm:text-2xl">
        {content.title}
      </h3>
      <p className="book-body mt-2 shrink-0 text-[12px] leading-relaxed sm:text-sm">
        {content.lede}
      </p>
      <ul className="mt-4 min-h-0 flex-1 space-y-3 overflow-auto">
        {content.skills.map((skill, i) => (
          <li key={skill.name} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <p className="book-ink font-mono text-[11px] font-semibold sm:text-xs">
                <span className="book-muted mr-2 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {skill.name}
              </p>
              <span className="book-muted font-mono text-[10px]">
                {skill.level}%
              </span>
            </div>
            <p className="book-body mt-0.5 line-clamp-2 text-[11px] leading-snug">
              {skill.blurb}
            </p>
            <div className="book-track mt-1.5 h-1 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${skill.level}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function IntroFace({
  content,
}: {
  content: Extract<SheetContent, { kind: "intro" }>;
}) {
  return (
    <>
      <p className="book-muted shrink-0 font-mono text-[10px] uppercase tracking-[0.18em]">
        Introduction
      </p>
      <h3 className="book-ink mt-3 shrink-0 font-display text-xl leading-tight sm:text-2xl">
        {content.title}
      </h3>
      <p className="book-body mt-2 shrink-0 text-[12px] leading-relaxed sm:text-sm">
        {content.lede}
      </p>
      <ol className="mt-4 grid min-h-0 flex-1 grid-cols-2 content-start gap-x-3 gap-y-1.5 overflow-auto">
        {content.skills.map((s, idx) => (
          <li
            key={s.name}
            className="book-ink flex min-w-0 items-baseline gap-1.5 font-mono text-[10px] sm:text-[11px]"
          >
            <span className="book-muted shrink-0 tabular-nums">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="truncate font-medium">{s.name}</span>
          </li>
        ))}
      </ol>
      <p className="book-muted mt-3 shrink-0 font-mono text-[10px]">
        {content.footer}
      </p>
    </>
  );
}

function SkillFace({
  content,
  compact,
}: {
  content: Extract<SheetContent, { kind: "skill" }>;
  compact?: boolean;
}) {
  const { skill, index, total } = content;
  const accent = SKILL_ACCENT[skill.name] ?? "#1b63ff";
  const Icon = SKILL_ICON[skill.name];

  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border sm:h-12 sm:w-12"
          style={{
            color: accent,
            borderColor: `${accent}55`,
            background: `${accent}18`,
            boxShadow: `0 0 20px ${accent}20`,
          }}
        >
          {Icon ? (
            <span className="text-[1.55rem] leading-none sm:text-[1.75rem]">
              <Icon />
            </span>
          ) : null}
        </div>
        <span className="book-muted font-mono text-[10px]">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <p className="book-muted mt-4 shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]">
        {skill.group}
      </p>
      <h3 className="book-ink mt-1 shrink-0 text-xl leading-none sm:text-2xl">
        {skill.name}
      </h3>
      <p className="book-body mt-2 shrink-0 text-[12px] font-medium leading-snug">
        {skill.blurb}
      </p>

      {!compact ? (
        <div className="mt-3 min-h-0 flex-1 overflow-hidden">
          <p className="book-muted font-mono text-[9px] uppercase tracking-[0.14em]">
            How I learned
          </p>
          <p className="book-body mt-1 line-clamp-5 text-[11px] leading-relaxed sm:text-[12px]">
            {skill.learned}
          </p>
          <ul className="mt-2.5 space-y-1">
            {skill.practice.slice(0, 2).map((item) => (
              <li
                key={item}
                className="book-body flex gap-2 text-[10px] leading-snug sm:text-[11px]"
              >
                <span
                  className="mt-[5px] h-1 w-1 shrink-0 rounded-full"
                  style={{ background: accent }}
                />
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {skill.focus.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]"
                style={{
                  color: accent,
                  borderColor: `${accent}44`,
                  background: `${accent}12`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="book-body mt-3 min-h-0 flex-1 overflow-hidden text-[11px] leading-relaxed sm:text-xs">
          {skill.learned}
        </p>
      )}

      <div className="mt-auto shrink-0 pt-3">
        <div className="book-muted mb-1.5 flex justify-between font-mono text-[10px]">
          <span>Level</span>
          <span>{skill.level}%</span>
        </div>
        <div className="book-track h-1.5 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full"
            style={{ width: `${skill.level}%`, background: accent }}
          />
        </div>
      </div>
    </>
  );
}

function NotesFace({
  content,
}: {
  content: Extract<SheetContent, { kind: "notes" }>;
}) {
  return (
    <>
      <p className="book-muted font-mono text-[10px] uppercase tracking-[0.16em]">
        {content.title}
      </p>
      <p className="book-ink mt-4 font-display text-lg leading-snug sm:text-xl">
        {content.body}
      </p>
      <p className="book-muted mt-auto font-mono text-[10px]">@{content.handle}</p>
    </>
  );
}
