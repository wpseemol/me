#!/usr/bin/env node
/**
 * Sync project JSON files in data/projects/ from the GitHub API.
 *
 * Usage:
 *   node scripts/sync-projects.mjs
 *   node scripts/sync-projects.mjs https://github.com/wpseemol/retail-market
 *   npm run sync:projects -- https://github.com/owner/repo
 *
 * See data/projects/INSTRUCTIONS.md for the full workflow (screenshots,
 * homepage-optional repos, pagination config).
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

function titleCaseSlug(slug) {
    return slug
        .split(/[-_]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

async function fetchJson(url) {
    const res = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "wpseemol-portfolio-sync",
        },
    });
    if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`);
    return res.json();
}

async function fetchRepo(owner, repo) {
    const meta = await fetchJson(`${API}/repos/${owner}/${repo}`);
    const languages = await fetchJson(`${API}/repos/${owner}/${repo}/languages`);
    return { meta, languages };
}

function readExisting(filePath) {
    if (!fs.existsSync(filePath)) return {};
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
        return {};
    }
}

function buildRecord(meta, languages, existing = {}) {
    const langList = Object.keys(languages).slice(0, 6);
    const homepage = (
        existing.homepage ||
        meta.homepage ||
        ""
    ).trim();
    const description = (
        existing.description ||
        meta.description ||
        ""
    ).trim();
    const slug = existing.slug || meta.name;
    const screenshot =
        existing.screenshot || `/images/projects/${slug}.png`;

    return {
        slug,
        name: existing.name || titleCaseSlug(slug),
        repo: meta.html_url,
        github: meta.html_url,
        homepage: homepage || "",
        description,
        detail:
            existing.detail ||
            description ||
            `${existing.name || titleCaseSlug(slug)} — synced from ${meta.html_url}.`,
        screenshot,
        framework: existing.framework || "",
        cms: existing.cms || "Custom (no CMS)",
        stack: existing.stack || {
            frontend: "",
            backend: "",
            dashboard: "",
            infra: "",
        },
        technologies: existing.technologies || langList,
        language: meta.language || langList[0] || existing.language || "Unknown",
        languages: langList.length ? langList : existing.languages || [],
        stars: meta.stargazers_count ?? existing.stars ?? 0,
        created: (meta.created_at || existing.created || "").slice(0, 10),
        updated: (meta.pushed_at || meta.updated_at || existing.updated || "").slice(
            0,
            10,
        ),
        status: homepage ? "live" : existing.status || "repo",
        featured: existing.featured !== false,
    };
}

/** Optional full-page snapshot when homepage exists. */
async function captureScreenshot(slug, homepage, keepPath) {
    if (!homepage) return keepPath || null;
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
            if (attempt.fullPage)
                api.searchParams.set("screenshot.fullPage", "true");
            if (attempt.height)
                api.searchParams.set("viewport.height", attempt.height);

            const payload = await fetchJson(api.toString());
            const shotUrl = payload?.data?.screenshot?.url;
            if (!shotUrl) throw new Error(`No screenshot URL for ${homepage}`);

            const pngRes = await fetch(shotUrl, {
                headers: { "User-Agent": "wpseemol-portfolio-sync" },
            });
            if (!pngRes.ok)
                throw new Error(`Screenshot download → ${pngRes.status}`);
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
        await sharp(buf)
            .resize({ width: 1280, withoutEnlargement: true })
            .webp({ quality: 72 })
            .toFile(webpPath);
        return `/images/projects/${slug}.webp`;
    } catch {
        const pngPath = path.join(SHOT_DIR, `${slug}.png`);
        fs.writeFileSync(pngPath, buf);
        return `/images/projects/${slug}.png`;
    }
}

function listProjectFiles() {
    if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    return fs
        .readdirSync(PROJECTS_DIR)
        .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
        .map((f) => path.join(PROJECTS_DIR, f));
}

async function syncFile(filePath) {
    const existing = readExisting(filePath);
    const repoUrl = existing.repo || existing.github;
    if (!repoUrl) {
        console.warn(`skip ${path.basename(filePath)} — missing repo/github`);
        return;
    }

    const { owner, repo } = parseOwnerRepo(repoUrl);
    const { meta, languages } = await fetchRepo(owner, repo);
    const next = buildRecord(meta, languages, existing);

    // Only auto-capture when no local screenshot file is referenced yet,
    // or the referenced file is missing — never clobber a hand-provided shot path
    // the user already put in public/images/projects/.
    const shotAbs = path.join(
        ROOT,
        "public",
        next.screenshot.replace(/^\//, "").replace(/\//g, path.sep),
    );
    if (next.homepage && !fs.existsSync(shotAbs)) {
        try {
            next.screenshot = await captureScreenshot(
                next.slug,
                next.homepage,
                next.screenshot,
            );
            console.log(`  ↳ screenshot ${next.screenshot}`);
        } catch (err) {
            console.warn(`  ↳ screenshot skipped: ${err.message || err}`);
        }
    }

    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    console.log(
        `✓ ${path.basename(filePath)}  ${next.status}${next.homepage ? ` → ${next.homepage}` : ""}`,
    );
}

async function ensureFromUrl(url) {
    const { owner, repo } = parseOwnerRepo(url);
    const filePath = path.join(PROJECTS_DIR, `${repo}.json`);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(
            filePath,
            `${JSON.stringify(
                {
                    slug: repo,
                    name: titleCaseSlug(repo),
                    repo: `https://github.com/${owner}/${repo}`,
                    github: `https://github.com/${owner}/${repo}`,
                    homepage: "",
                    description: "",
                    detail: "",
                    screenshot: `/images/projects/${repo}.png`,
                    language: "Unknown",
                    languages: [],
                    stars: 0,
                    created: "",
                    updated: "",
                    status: "repo",
                    featured: true,
                },
                null,
                2,
            )}\n`,
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
            "No .json files in data/projects/. Pass a GitHub URL to create one.",
        );
        return;
    }
    for (const file of files) await syncFile(file);
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
