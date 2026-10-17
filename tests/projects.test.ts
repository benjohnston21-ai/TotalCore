import { describe, expect, it } from "vitest";
import { projectInput } from "@/lib/projects";

const base = { name: "Tower A", number: "", stage: "bidding", address: "", city: "", state: "", zip: "", startDate: "", completionDate: "" };

describe("projectInput", () => {
  it("turns blank optional fields into null", () => {
    const parsed = projectInput.parse(base);
    expect(parsed.number).toBeNull();
    expect(parsed.startDate).toBeNull();
  });

  it("rejects a completion date before the start date", () => {
    const result = projectInput.safeParse({ ...base, startDate: "2026-05-01", completionDate: "2026-04-01" });
    expect(result.success).toBe(false);
  });

  it("requires a name", () => {
    expect(projectInput.safeParse({ ...base, name: "  " }).success).toBe(false);
  });
});
