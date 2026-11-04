import skillsJson from "@/data/skills.json";
import site from "@/data/site.json";

export type Skill = (typeof skillsJson.skills)[number];

export type SheetContent =
  | {
      kind: "intro";
      title: string;
      lede: string;
      footer: string;
      skills: Skill[];
    }
  | {
      kind: "group";
      title: string;
      lede: string;
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

/** Group skills so the 3D book has a readable page count (not 15+ flips). */
const GROUPS: { id: string; title: string; lede: string; names: string[] }[] = [
  {
    id: "foundation",
    title: "Foundation",
    lede: "Markup, style, and the utility layer I start every UI from.",
    names: ["HTML", "CSS", "Tailwind CSS"],
  },
  {
    id: "frontend",
    title: "Frontend",
    lede: "Component systems and app frameworks I ship interfaces with.",
    names: ["React", "Next.js", "TypeScript"],
  },
  {
    id: "backend",
    title: "Backend",
    lede: "APIs and servers when the product needs more than a static shell.",
    names: ["Laravel", "PHP", "Node.js", "Express"],
  },
  {
    id: "data",
    title: "Data & cache",
    lede: "Persistence and speed — the parts users never see but always feel.",
    names: ["MongoDB", "MySQL", "Redis"],
  },
  {
    id: "ops",
    title: "Ship & run",
    lede: "Containers and release paths so the build survives outside my laptop.",
    names: ["Docker"],
  },
];

function skillsByNames(names: string[]): Skill[] {
  return names
    .map((n) => skills.find((s) => s.name === n))
    .filter(Boolean) as Skill[];
}

/**
 * Leaves for the 3D book — intro + grouped chapters (readable pacing).
 * Mobile can still page through these same sheets.
 */
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
      title: "Field note",
      body: meta.insideCover,
      handle: profile.handle,
    },
  },
  ...GROUPS.map((g, gi) => {
    const list = skillsByNames(g.names);
    const next = GROUPS[gi + 1];
    return {
      id: g.id,
      front: {
        kind: "group" as const,
        title: g.title,
        lede: g.lede,
        skills: list,
      },
      back: {
        kind: "notes" as const,
        title: next ? `Next · ${next.title}` : "Endpaper",
        body: next
          ? next.lede
          : "That's the stack. Scroll on — or open a project next.",
        handle: profile.handle,
      },
    };
  }),
];

export const LEFT_ENDPAPER = {
  eyebrow: `${profile.handle} · ${meta.leftLeafTitle}`,
  body: meta.leftLeafBody,
  footer: `${skills.length} skills · ${GROUPS.length} chapters`,
};

export const RIGHT_BASE = {
  eyebrow: "Endpaper",
  title: "Keep shipping",
  body: "That's the full stack I reach for in production. Scroll back up anytime — or open a project next.",
};
