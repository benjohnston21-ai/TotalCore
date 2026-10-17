"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getProjectAccess, requireCompanyAdmin } from "@/lib/auth";
import { diffFields, recordAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/password";
import { PERMISSION_TEMPLATES, TOOLS, LEVELS, type ToolPermissions } from "@/lib/permissions";
import { projectInput } from "@/lib/projects";
import type { FormState } from "@/components/form";
import { failure } from "@/lib/form-state";

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireCompanyAdmin();
  const parsed = projectInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0].message, formData);

  const project = await db.transaction(async (tx) => {
    const [project] = await tx
      .insert(schema.projects)
      .values({ ...parsed.data, companyId: user.companyId })
      .returning();
    await tx.insert(schema.projectMembers).values({
      projectId: project.id,
      userId: user.id,
      permissions: PERMISSION_TEMPLATES.project_admin.permissions,
    });
    return project;
  });
  await recordAudit({
    companyId: user.companyId,
    projectId: project.id,
    actorId: user.id,
    itemType: "project",
    itemId: project.id,
    action: "created",
  });
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user, project, can } = await getProjectAccess(projectId);
  if (!can("directory", "admin")) return failure("You don't have permission to edit this project", formData);

  const parsed = projectInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0].message, formData);

  const changes = diffFields(project, parsed.data);
  if (Object.keys(changes).length === 0) return { message: "No changes" };

  await db.update(schema.projects).set(parsed.data).where(eq(schema.projects.id, project.id));
  await recordAudit({
    companyId: project.companyId,
    projectId: project.id,
    actorId: user.id,
    itemType: "project",
    itemId: project.id,
    action: "updated",
    changes,
  });
  revalidatePath(`/projects/${project.id}`, "layout");
  return { message: "Project saved" };
}

const addMemberInput = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  name: z.string().trim(),
  template: z.enum(Object.keys(PERMISSION_TEMPLATES) as [keyof typeof PERMISSION_TEMPLATES]),
});

// Adds someone to the project directory. If they aren't in the company yet,
// they're created with a temporary password that the admin passes on.
export async function addProjectMember(projectId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { user, project, can } = await getProjectAccess(projectId);
  if (!can("directory", "admin")) return failure("You don't have permission to add people", formData);

  const parsed = addMemberInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0].message, formData);
  const { email, name, template } = parsed.data;

  let [person] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  let tempPassword: string | undefined;

  if (person) {
    const [membership] = await db
      .select()
      .from(schema.companyMembers)
      .where(and(eq(schema.companyMembers.userId, person.id), eq(schema.companyMembers.companyId, project.companyId)));
    if (!membership) return failure("That email belongs to a user in another company", formData);
  } else {
    if (!name) return failure("Enter a name for the new person", formData);
    tempPassword = randomBytes(9).toString("base64url");
    const passwordHash = await hashPassword(tempPassword);
    person = await db.transaction(async (tx) => {
      const [created] = await tx.insert(schema.users).values({ email, name, passwordHash }).returning();
      await tx.insert(schema.companyMembers).values({ companyId: project.companyId, userId: created.id });
      return created;
    });
  }

  const inserted = await db
    .insert(schema.projectMembers)
    .values({ projectId, userId: person.id, permissions: PERMISSION_TEMPLATES[template].permissions })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) return failure(`${person.name} is already on this project`, formData);

  await recordAudit({
    companyId: project.companyId,
    projectId,
    actorId: user.id,
    itemType: "project_member",
    itemId: person.id,
    action: "created",
    changes: { template: [null, template] },
  });
  revalidatePath(`/projects/${projectId}/directory`);
  return {
    message: tempPassword
      ? `Added ${person.name}. Their temporary password is ${tempPassword} (it won't be shown again).`
      : `Added ${person.name}.`,
  };
}

const permissionsInput = z.object(
  Object.fromEntries(TOOLS.map((t) => [t, z.enum(LEVELS)])) as Record<(typeof TOOLS)[number], z.ZodEnum<{ [K in (typeof LEVELS)[number]]: K }>>,
);

export async function updateMemberPermissions(
  projectId: string,
  memberId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user, project, can } = await getProjectAccess(projectId);
  if (!can("directory", "admin")) return failure("You don't have permission to change access", formData);

  const parsed = permissionsInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Invalid permission level", formData);
  const permissions: ToolPermissions = parsed.data;

  const [existing] = await db
    .select()
    .from(schema.projectMembers)
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, memberId)));
  if (!existing) return failure("That person isn't on this project", formData);
  if (memberId === user.id && permissions.directory !== "admin" && !user.isCompanyAdmin) {
    return failure("You can't remove your own directory admin access", formData);
  }

  await db
    .update(schema.projectMembers)
    .set({ permissions })
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, memberId)));
  await recordAudit({
    companyId: project.companyId,
    projectId,
    actorId: user.id,
    itemType: "project_member",
    itemId: memberId,
    action: "updated",
    changes: diffFields(existing.permissions, permissions),
  });
  revalidatePath(`/projects/${projectId}/directory`);
  return { message: "Access updated" };
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const { user, project, can } = await getProjectAccess(projectId);
  if (!can("directory", "admin") || memberId === user.id) return;
  await db
    .delete(schema.projectMembers)
    .where(and(eq(schema.projectMembers.projectId, projectId), eq(schema.projectMembers.userId, memberId)));
  await recordAudit({
    companyId: project.companyId,
    projectId,
    actorId: user.id,
    itemType: "project_member",
    itemId: memberId,
    action: "deleted",
  });
  revalidatePath(`/projects/${projectId}/directory`);
}
