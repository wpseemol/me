#!/usr/bin/env node
/**
 * Sync project markdown files in data/projects/ from the GitHub API.
 *
 * Usage:
 *   node scripts/sync-projects.mjs
 *   node scripts/sync-projects.mjs https://github.com/wpseemol/mangrove-collection
 *   npm run sync:projects -- https://github.com/owner/repo
 *
 * Drop a new .md in data/projects/ with only `repo:` in the frontmatter, then
 * run this script — description, homepage (live URL), languages, dates, and a
 * full-page screenshot are filled from the repo About section via the public
 * GitHub API. Static export stays intact: the site reads the .md files at
 * build time.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PROJECTS_DIR = path.join(ROOT, "data", "projects");
const SHOT_DIR = path.join(ROOT, "public", "images", "projects");
const API = "https://api.github.com";

function parseOwnerRepo(input) {
    const cleaned = String(input).trim().replace(/\.git$/, "");
    const m = cleaned.match(
        /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/#?\s]+)/i,
    );
    if (m) return { owner: m[1], repo: m[2] };
    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length === 2) return { owner: parts[0], repo: parts[1] };
    throw new Error(`Not a GitHub repo URL or owner/repo: ${input}`);
}

function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { data: {}, body: raw.trim() };
    const data = {};
    for (const line of match[1].split(/\r?\n/)) {
        if (!line.trim() || line.trimStart().startsWith("#")) continue;
        if (/^\s+- /.test(line)) {
            const key = Object.keys(data).at(-1);
            if (!key) continue;
            if (!Array.isArray(data[key])) data[key] = [];
            data[key].push(line.replace(/^\s+- /, "").trim());
            continue;
        }
        const idx = line.indexOf(":");
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        if (value === "") {
            data[key] = [];
            continue;
        }
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (value === "true") data[key] = true;
        else if (value === "false") data[key] = false;
        else if (/^\d+$/.test(value)) data[key] = Number(value);
        else data[key] = value;
    }
    return { data, body: match[2].trim() };
}

function titleCaseSlug(slug) {
    return slug
        .split(/[-_]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function yamlValue(v) {
    if (typeof v === "boolean" || typeof v === "number") return String(v);
    const s = String(v ?? "");
    if (/[:#\-\[\]{},&*?|>!%@`]/.test(s) || s.includes("'") || s.includes('"')) {
        return JSON.stringify(s);
    }
    return s;
}

function toMarkdown(data, body) {
    const lines = ["---"];
    const order = [
        "repo",
        "slug",
        "name",
        "description",
        "homepage",
        "github",
        "screenshot",
        "language",
        "languages",
        "stars",
        "created",
        "updated",
        "status",
        "featured",
    ];
    for (const key of order) {
        if (!(key in data) || data[key] == null || data[key] === "") continue;
        const value = data[key];
        if (Array.isArray(value)) {
            lines.push(`${key}:`);
            for (const item of value) lines.push(`  - ${yamlValue(item)}`);
        } else {
            lines.push(`${key}: ${yamlValue(value)}`);
        }
    }
    lines.push("---", "", body.trim(), "");
    return lines.join("\n");
}

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "wpseemol-portfolio-sync",
        },
    });
    if (!res.ok) {
        throw new Error(`${url} → ${res.status} ${res.statusText}`);
    }
    return res.json();
}

async function fetchRepo(owner, repo) {
    const meta = await fetchJson(`${API}/repos/${owner}/${repo}`);
    const languages = await fetchJson(`${API}/repos/${owner}/${repo}/languages`);
    return { meta, languages };
}

function buildRecord(meta, languages, existing = {}) {
    const langList = Object.keys(languages).slice(0, 6);
    const homepage = (meta.homepage || existing.homepage || "").trim();
    const description = (meta.description || existing.description || "").trim();
    const slug = meta.name;
    return {
        repo: meta.html_url,
        slug,
        name: existing.name || titleCaseSlug(slug),
        description,
        homepage: homepage || "",
        github: meta.html_url,
        screenshot:
            existing.screenshot || `/images/projects/${slug}.webp`,
        language: meta.language || langList[0] || "Unknown",
        languages: langList,
        stars: meta.stargazers_count ?? 0,
        created: (meta.created_at || "").slice(0, 10),
        updated: (meta.pushed_at || meta.updated_at || "").slice(0, 10),
        status: homepage ? "live" : existing.status || "repo",
        featured: existing.featured !== false,
    };
}

/** Full-page snapshot → public/images/projects/{slug}.webp (tall for hover scroll). */
async function captureScreenshot(slug, homepage) {
    if (!homepage) return null;
    fs.mkdirSync(SHOT_DIR, { recursive: true });

    const attempts = [
        { fullPage: true, height: null },
        { fullPage: false, height: "3600" },
        { fullPage: false, height: "1600" },
    ];

    let buf = null;
    let lastErr = null;
    for (const attempt of attempts) {
        try {
            const api = new URL("https://api.microlink.io/");
            api.searchParams.set("url", homepage);
            api.searchParams.set("screenshot", "true");
            api.searchParams.set("meta", "false");
            api.searchParams.set("viewport.width", "1280");
            if (attempt.fullPage) api.searchParams.set("screenshot.fullPage", "true");
            if (attempt.height) api.searchParams.set("viewport.height", attempt.height);

            const payload = await fetchJson(api.toString());
            const shotUrl = payload?.data?.screenshot?.url;
            if (!shotUrl) throw new Error(`No screenshot URL for ${homepage}`);

            const pngRes = await fetch(shotUrl, {
                headers: { "User-Agent": "wpseemol-portfolio-sync" },
            });
            if (!pngRes.ok) throw new Error(`Screenshot download → ${pngRes.status}`);
            buf = Buffer.from(await pngRes.arrayBuffer());
            break;
        } catch (err) {
            lastErr = err;
        }
    }
    if (!buf) throw lastErr || new Error(`Screenshot failed for ${homepage}`);

    const webpPath = path.join(SHOT_DIR, `${slug}.webp`);
    try {
        const sharp = (await import("sharp")).default;
        // Keep full height — hover cards scroll the tall image.
        await sharp(buf)
            .resize({ width: 1280, withoutEnlargement: true })
            .webp({ quality: 72 })
            .toFile(webpPath);
    } catch {
        const pngPath = path.join(SHOT_DIR, `${slug}.png`);
        fs.writeFileSync(pngPath, buf);
        return `/images/projects/${slug}.png`;
    }
    return `/images/projects/${slug}.webp`;
}

function listProjectFiles() {
    if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    return fs
        .readdirSync(PROJECTS_DIR)
        .filter((f) => f.endsWith(".md"))
        .map((f) => path.join(PROJECTS_DIR, f));
}

async function syncFile(filePath) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, body } = parseFrontmatter(raw);
    if (!data.repo) {
        console.warn(`skip ${path.basename(filePath)} — missing repo:`);
        return;
    }
    const { owner, repo } = parseOwnerRepo(data.repo);
    const { meta, languages } = await fetchRepo(owner, repo);
    const next = buildRecord(meta, languages, data);

    if (next.homepage) {
        try {
            next.screenshot = await captureScreenshot(next.slug, next.homepage);
            console.log(`  ↳ screenshot ${next.screenshot}`);
        } catch (err) {
            console.warn(`  ↳ screenshot skipped: ${err.message || err}`);
        }
    }

    const note =
        body ||
        `${next.name} — synced from ${next.github}.`;
    fs.writeFileSync(filePath, toMarkdown(next, note), "utf8");
    console.log(
        `✓ ${path.basename(filePath)}  ${next.status}${next.homepage ? ` → ${next.homepage}` : ""}`,
    );
}

async function ensureFromUrl(url) {
    const { owner, repo } = parseOwnerRepo(url);
    const filePath = path.join(PROJECTS_DIR, `${repo}.md`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(
            filePath,
            toMarkdown({ repo: `https://github.com/${owner}/${repo}` }, ""),
            "utf8",
        );
        console.log(`+ created ${path.basename(filePath)}`);
    }
    await syncFile(filePath);
}

async function main() {
    const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
    if (args.length) {
        for (const url of args) await ensureFromUrl(url);
        return;
    }
    const files = listProjectFiles();
    if (!files.length) {
        console.log(
            "No .md files in data/projects/. Pass a GitHub URL to create one.",
        );
        return;
    }
    for (const file of files) await syncFile(file);
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
