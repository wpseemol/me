"use client";

import { useMemo, useState } from "react";
import type { WorkingProject } from "@/lib/working-projects";
import WorkingProjects from "./WorkingProjects";
import { ArrowIcon } from "./Icons";

export default function ProjectsPager({
    projects,
    pageSize = 4,
}: {
    projects: WorkingProject[];
    pageSize?: number;
}) {
    const size = Math.max(1, pageSize);
    const totalPages = Math.max(1, Math.ceil(projects.length / size));
    const [page, setPage] = useState(0);

    const slice = useMemo(() => {
        const safe = Math.min(page, totalPages - 1);
        const start = safe * size;
        return projects.slice(start, start + size);
    }, [page, projects, size, totalPages]);

    if (!projects.length) return null;

    return (
        <div>
            <WorkingProjects projects={slice} />

            {totalPages > 1 ? (
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
                    <p className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
                        Page {Math.min(page, totalPages - 1) + 1} / {totalPages}
                        <span className="mx-2 opacity-40">·</span>
                        {projects.length} projects
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="btn btn-ghost px-4 py-2 disabled:pointer-events-none disabled:opacity-40"
                            disabled={page <= 0}
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            aria-label="Previous projects page"
                        >
                            <ArrowIcon
                                width={15}
                                height={15}
                                className="rotate-180"
                            />
                            Prev
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost px-4 py-2 disabled:pointer-events-none disabled:opacity-40"
                            disabled={page >= totalPages - 1}
                            onClick={() =>
                                setPage((p) => Math.min(totalPages - 1, p + 1))
                            }
                            aria-label="Next projects page"
                        >
                            Next
                            <ArrowIcon width={15} height={15} />
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
