import skillsJson from "@/data/skills.json";
import site from "@/data/site.json";

export type Skill = (typeof skillsJson.skills)[number];

export type PageKind = "intro" | "skill" | "notes";

export type SheetContent =
  | {
      kind: "intro";
      title: string;
      lede: string;
      footer: string;
      skills: Skill[];
    }
  | {
      kind: "skill";
      skill: Skill;
      index: number;
      total: number;
    }
  | {
      kind: "notes";
      title: string;
      body: string;
      handle: string;
    };

export type FlipSheet = {
  id: string;
  front: SheetContent;
  back: SheetContent;
};

export const meta = skillsJson.meta;
export const skills = skillsJson.skills as Skill[];
export const profile = site.profile;

/** Physical leaves stacked on the right half (top flips first). */
export const FLIP_SHEETS: FlipSheet[] = [
  {
    id: "intro",
    front: {
      kind: "intro",
      title: meta.introTitle,
      lede: meta.introLede,
      footer: meta.introFooter,
      skills,
    },
    back: {
      kind: "notes",
      title: "Inside cover",
      body: meta.insideCover,
      handle: profile.handle,
    },
  },
  ...skills.map((skill, index) => ({
    id: skill.name,
    front: {
      kind: "skill" as const,
      skill,
      index,
      total: skills.length,
    },
    back: {
      kind: "skill" as const,
      skill,
      index,
      total: skills.length,
    },
  })),
];

export const LEFT_ENDPAPER = {
  eyebrow: `${profile.handle} · ${meta.leftLeafTitle}`,
  body: meta.leftLeafBody,
  footer: `${skills.length} skills · scroll to turn`,
};

export const RIGHT_BASE = {
  eyebrow: "Endpaper",
  title: "Keep shipping",
  body: "That's the full stack I reach for in production. Scroll back up anytime — or open a project next.",
};
