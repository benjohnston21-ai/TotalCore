import { describe, expect, it } from "vitest";
import {
  levelAtLeast,
  normalizePermissions,
  PERMISSION_TEMPLATES,
  TOOLS,
} from "@/lib/permissions";

describe("levelAtLeast", () => {
  it("orders none < read < standard < admin", () => {
    expect(levelAtLeast("admin", "standard")).toBe(true);
    expect(levelAtLeast("standard", "standard")).toBe(true);
    expect(levelAtLeast("read", "standard")).toBe(false);
    expect(levelAtLeast("none", "read")).toBe(false);
  });
});

describe("normalizePermissions", () => {
  it("fills missing tools with none and drops bad values", () => {
    const perms = normalizePermissions({ rfis: "admin", drawings: "superuser", bogus: "admin" });
    expect(perms.rfis).toBe("admin");
    expect(perms.drawings).toBe("none");
    expect(Object.keys(perms).sort()).toEqual([...TOOLS].sort());
  });

  it("handles null", () => {
    expect(Object.values(normalizePermissions(null)).every((l) => l === "none")).toBe(true);
  });
});

describe("PERMISSION_TEMPLATES", () => {
  it("covers every tool in every template", () => {
    for (const t of Object.values(PERMISSION_TEMPLATES)) {
      expect(Object.keys(t.permissions).sort()).toEqual([...TOOLS].sort());
    }
  });
});
