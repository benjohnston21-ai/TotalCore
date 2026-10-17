// Per-project, per-tool access levels. Every project member has one level for
// each tool; company admins get "admin" everywhere.

export const TOOLS = [
  "directory",
  "drawings",
  "rfis",
  "submittals",
  "photos",
  "daily_log",
] as const;
export type Tool = (typeof TOOLS)[number];

export const TOOL_LABELS: Record<Tool, string> = {
  directory: "Directory",
  drawings: "Drawings",
  rfis: "RFIs",
  submittals: "Submittals",
  photos: "Photos",
  daily_log: "Daily Log",
};

export const LEVELS = ["none", "read", "standard", "admin"] as const;
export type Level = (typeof LEVELS)[number];

export type ToolPermissions = Record<Tool, Level>;

export function levelAtLeast(actual: Level, required: Level): boolean {
  return LEVELS.indexOf(actual) >= LEVELS.indexOf(required);
}

function uniform(level: Level): ToolPermissions {
  return Object.fromEntries(TOOLS.map((t) => [t, level])) as ToolPermissions;
}

// Starting points when adding someone to a project. Admins can tweak
// individual tools afterwards.
export const PERMISSION_TEMPLATES = {
  project_admin: { label: "Project Admin", permissions: uniform("admin") },
  project_manager: {
    label: "Project Manager",
    permissions: { ...uniform("standard"), directory: "admin", rfis: "admin", submittals: "admin" },
  },
  design_team: {
    label: "Architect / Engineer",
    permissions: { ...uniform("read"), rfis: "standard", submittals: "standard", drawings: "standard" },
  },
  subcontractor: {
    label: "Subcontractor",
    permissions: { ...uniform("read"), rfis: "standard", submittals: "standard", photos: "standard", daily_log: "none" },
  },
  read_only: { label: "Read Only", permissions: uniform("read") },
} satisfies Record<string, { label: string; permissions: ToolPermissions }>;

export type PermissionTemplate = keyof typeof PERMISSION_TEMPLATES;

export const FULL_ACCESS = uniform("admin");
export const NO_ACCESS = uniform("none");

// Fill in any tools missing from stored JSON (e.g. tools added after the
// member was created) with "none", and drop unknown keys or levels.
export function normalizePermissions(raw: unknown): ToolPermissions {
  const out = { ...NO_ACCESS };
  if (raw && typeof raw === "object") {
    for (const tool of TOOLS) {
      const value = (raw as Record<string, unknown>)[tool];
      if (typeof value === "string" && (LEVELS as readonly string[]).includes(value)) {
        out[tool] = value as Level;
      }
    }
  }
  return out;
}
