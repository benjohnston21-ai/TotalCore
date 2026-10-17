import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
  });

  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});
