import type { Tool } from "./permissions";

// URL segment for each tool under /projects/[projectId]/.
export const TOOL_SLUGS: Record<Tool, string> = {
  directory: "directory",
  drawings: "drawings",
  rfis: "rfis",
  submittals: "submittals",
  photos: "photos",
  daily_log: "daily-log",
};

export function toolHref(projectId: string, tool: Tool) {
  return `/projects/${projectId}/${TOOL_SLUGS[tool]}`;
}

export function toolFromSlug(slug: string): Tool | undefined {
  return (Object.keys(TOOL_SLUGS) as Tool[]).find((t) => TOOL_SLUGS[t] === slug);
}
