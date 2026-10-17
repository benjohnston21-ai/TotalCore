import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { newStorageKey, storage } from "./storage";
import type { ProjectAccess } from "./auth";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

// Store an uploaded file for a project and optionally attach it to an item.
export async function saveProjectFile(
  access: ProjectAccess,
  file: File,
  attachTo?: { itemType: string; itemId: string },
) {
  if (file.size === 0) throw new Error("File is empty");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is larger than 50 MB");

  const { project, user } = access;
  const storageKey = newStorageKey(project.companyId, file.name);
  await storage().put(storageKey, Buffer.from(await file.arrayBuffer()), file.type);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.files)
      .values({
        companyId: project.companyId,
        projectId: project.id,
        name: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        storageKey,
        uploadedById: user.id,
      })
      .returning();
    if (attachTo) {
      await tx.insert(schema.attachments).values({ projectId: project.id, fileId: row.id, ...attachTo });
    }
    return row;
  });
}

export async function listAttachments(projectId: string, itemType: string, itemId: string) {
  return db
    .select({ file: schema.files })
    .from(schema.attachments)
    .innerJoin(schema.files, eq(schema.files.id, schema.attachments.fileId))
    .where(
      and(
        eq(schema.attachments.projectId, projectId),
        eq(schema.attachments.itemType, itemType),
        eq(schema.attachments.itemId, itemId),
      ),
    )
    .then((rows) => rows.map((r) => r.file));
}
