import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ db: {}, schema: {} }));

const { diffFields } = await import("@/lib/audit");

describe("diffFields", () => {
  it("returns only the fields that changed", () => {
    expect(diffFields({ a: 1, b: "x", c: null }, { a: 1, b: "y", c: undefined })).toEqual({ b: ["x", "y"] });
  });
});
