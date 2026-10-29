import fs from "node:fs";
import path from "node:path";

export type ProjectStack = {
    frontend: string;
    backend: string;
    dashboard: string;
    infra: string;
};

export type WorkingProject = {
    slug: string;
    name: string;
    description: string;
    detail: string;
    homepage: string;
    github: string;
    screenshot: string;
    /** Primary app framework, e.g. "Next.js" or "Next.js + Laravel". */
    framework: string;
    /** CMS used to build the product — "Custom (no CMS)", "WordPress", "Shopify", etc. */
    cms: string;
    stack: ProjectStack;
    /** Chip list shown on the card (prefer over raw languages). */
    technologies: string[];
    language: string;
    languages: string[];
    stars: number;
    created: string;
    updated: string;
    status: "live" | "repo" | string;
    featured: boolean;
};

export type ProjectsConfig = {
    pageSize: number;
    homeLimit: number;
};

const PROJECTS_DIR = path.join(process.cwd(), "data", "projects");

const DEFAULT_CONFIG: ProjectsConfig = {
    pageSize: 4,
    homeLimit: 4,
};

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asBool(v: unknown, fallback = true): boolean {
    return typeof v === "boolean" ? v : fallback;
}

function asStringList(v: unknown): string[] {
    return Array.isArray(v) ? v.map(String) : [];
}

function asStack(v: unknown): ProjectStack {
    const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
    return {
        frontend: asString(o.frontend),
        backend: asString(o.backend),
        dashboard: asString(o.dashboard),
        infra: asString(o.infra),
    };
}

function normalize(raw: Record<string, unknown>): WorkingProject | null {
    const github = asString(raw.github) || asString(raw.repo);
    const slug =
        asString(raw.slug) ||
        github.split("/").filter(Boolean).at(-1) ||
        "";
    if (!slug) return null;

    const homepage = asString(raw.homepage).trim();
    const screenshot =
        asString(raw.screenshot).trim() ||
        `/images/projects/${slug}.png`;
    const description = asString(raw.description);
    const detail = asString(raw.detail) || description;
    const languages = asStringList(raw.languages);
    const technologies = asStringList(raw.technologies);
    const chips = technologies.length ? technologies : languages;

    return {
        slug,
        name: asString(raw.name, slug),
        description,
        detail,
        homepage,
        github,
        screenshot,
        framework: asString(raw.framework),
        cms: asString(raw.cms, "Custom (no CMS)"),
        stack: asStack(raw.stack),
        technologies: chips,
        language: asString(raw.language, "Unknown"),
        languages,
        stars: asNumber(raw.stars),
        created: asString(raw.created),
        updated: asString(raw.updated),
        status: homepage ? "live" : asString(raw.status, "repo"),
        featured: asBool(raw.featured, true),
    };
}

export function getProjectsConfig(): ProjectsConfig {
    const file = path.join(PROJECTS_DIR, "_config.json");
    if (!fs.existsSync(file)) return { ...DEFAULT_CONFIG };
    try {
        const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<ProjectsConfig>;
        return {
            pageSize: Math.max(1, asNumber(raw.pageSize, DEFAULT_CONFIG.pageSize)),
            homeLimit: Math.max(0, asNumber(raw.homeLimit, DEFAULT_CONFIG.homeLimit)),
        };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

/** Read data/projects/*.json at build time — safe for `output: "export"`. */
export function getWorkingProjects(options?: {
    featuredOnly?: boolean;
    limit?: number;
}): WorkingProject[] {
    if (!fs.existsSync(PROJECTS_DIR)) return [];

    let list = fs
        .readdirSync(PROJECTS_DIR)
        .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
        .map((f) => {
            try {
                const raw = JSON.parse(
                    fs.readFileSync(path.join(PROJECTS_DIR, f), "utf8"),
                ) as Record<string, unknown>;
                return normalize(raw);
            } catch {
                return null;
            }
        })
        .filter((p): p is WorkingProject => Boolean(p))
        .sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));

    if (options?.featuredOnly) {
        list = list.filter((p) => p.featured);
    }

    if (options?.limit && options.limit > 0) {
        list = list.slice(0, options.limit);
    }

    return list;
}
