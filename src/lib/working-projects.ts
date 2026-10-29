import fs from "node:fs";
import path from "node:path";

export type WorkingProject = {
    slug: string;
    name: string;
    description: string;
    homepage: string;
    github: string;
    language: string;
    languages: string[];
    stars: number;
    created: string;
    updated: string;
    status: "live" | "repo" | string;
    featured: boolean;
    body: string;
};

function parseFrontmatter(raw: string): {
    data: Record<string, unknown>;
    body: string;
} {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { data: {}, body: raw.trim() };

    const data: Record<string, unknown> = {};
    let lastKey: string | null = null;

    for (const line of match[1].split(/\r?\n/)) {
        if (!line.trim() || line.trimStart().startsWith("#")) continue;

        if (/^\s+- /.test(line)) {
            if (!lastKey) continue;
            const list = Array.isArray(data[lastKey])
                ? (data[lastKey] as unknown[])
                : [];
            list.push(line.replace(/^\s+- /, "").trim());
            data[lastKey] = list;
            continue;
        }

        const idx = line.indexOf(":");
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value: unknown = line.slice(idx + 1).trim();
        lastKey = key;

        if (value === "") {
            data[key] = [];
            continue;
        }

        if (typeof value === "string") {
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            } else if (value === "true") value = true;
            else if (value === "false") value = false;
            else if (/^\d+$/.test(value)) value = Number(value);
        }

        data[key] = value;
    }

    return { data, body: match[2].trim() };
}

function asString(v: unknown, fallback = ""): string {
    return typeof v === "string" ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
    return typeof v === "number" ? v : fallback;
}

function asBool(v: unknown, fallback = true): boolean {
    return typeof v === "boolean" ? v : fallback;
}

function asStringList(v: unknown): string[] {
    return Array.isArray(v) ? v.map(String) : [];
}

function normalize(data: Record<string, unknown>, body: string): WorkingProject | null {
    const github = asString(data.github) || asString(data.repo);
    const slug =
        asString(data.slug) ||
        github.split("/").filter(Boolean).at(-1) ||
        "";
    if (!slug || !github) return null;

    const homepage = asString(data.homepage).trim();

    return {
        slug,
        name: asString(data.name, slug),
        description: asString(data.description),
        homepage,
        github,
        language: asString(data.language, "Unknown"),
        languages: asStringList(data.languages),
        stars: asNumber(data.stars),
        created: asString(data.created),
        updated: asString(data.updated),
        status: homepage ? "live" : asString(data.status, "repo"),
        featured: asBool(data.featured, true),
        body,
    };
}

/** Read /db/*.md at build time — safe for `output: "export"`. */
export function getWorkingProjects(): WorkingProject[] {
    const dir = path.join(process.cwd(), "db");
    if (!fs.existsSync(dir)) return [];

    return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => {
            const raw = fs.readFileSync(path.join(dir, f), "utf8");
            const { data, body } = parseFrontmatter(raw);
            return normalize(data, body);
        })
        .filter((p): p is WorkingProject => Boolean(p))
        .sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
}
