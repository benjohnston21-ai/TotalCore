import "server-only";
import { db, schema } from "@/db";

type AuditInput = {
  companyId: string;
  projectId?: string | null;
  actorId: string | null;
  itemType: string;
  itemId: string;
  action: "created" | "updated" | "deleted" | "restored" | string;
  changes?: Record<string, [unknown, unknown]>;
};

export async function recordAudit(input: AuditInput) {
  await db.insert(schema.auditEvents).values(input);
}

// Compare two versions of a record and return { field: [before, after] } for
// the fields that changed. Used to build the change history on every item.
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: Partial<T>,
): Record<string, [unknown, unknown]> {
  const changes: Record<string, [unknown, unknown]> = {};
  for (const key of Object.keys(after)) {
    // Treat null and undefined as the same "empty" value.
    const a = before[key] ?? null;
    const b = after[key] ?? null;
    if (JSON.stringify(a) !== JSON.stringify(b)) changes[key] = [a, b];
  }
  return changes;
}
