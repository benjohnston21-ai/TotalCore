import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSessionUserId } from "./session";
import {
  FULL_ACCESS,
  levelAtLeast,
  normalizePermissions,
  type Level,
  type Tool,
  type ToolPermissions,
} from "./permissions";

// Data access layer: every page and server action goes through these helpers
// so authorization is checked next to the data, never trusted from the client.

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  companyId: string;
  companyName: string;
  isCompanyAdmin: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const [row] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      companyId: schema.companies.id,
      companyName: schema.companies.name,
      role: schema.companyMembers.role,
    })
    .from(schema.users)
    .innerJoin(schema.companyMembers, eq(schema.companyMembers.userId, schema.users.id))
    .innerJoin(schema.companies, eq(schema.companies.id, schema.companyMembers.companyId))
    .where(eq(schema.users.id, userId))
    .orderBy(asc(schema.companyMembers.createdAt))
    .limit(1);
  if (!row) return null;
  const { role, ...user } = row;
  return { ...user, isCompanyAdmin: role === "admin" };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCompanyAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.isCompanyAdmin) notFound();
  return user;
}

export type ProjectAccess = {
  user: CurrentUser;
  project: typeof schema.projects.$inferSelect;
  permissions: ToolPermissions;
  can: (tool: Tool, level?: Level) => boolean;
};

export const getProjectAccess = cache(async (projectId: string): Promise<ProjectAccess> => {
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) notFound();

  const [row] = await db
    .select({ project: schema.projects, permissions: schema.projectMembers.permissions })
    .from(schema.projects)
    .leftJoin(
      schema.projectMembers,
      and(eq(schema.projectMembers.projectId, schema.projects.id), eq(schema.projectMembers.userId, user.id)),
    )
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.companyId, user.companyId)))
    .limit(1);

  // Hide projects the user isn't on rather than revealing they exist.
  if (!row || (!user.isCompanyAdmin && row.permissions === null)) notFound();

  const permissions = user.isCompanyAdmin ? FULL_ACCESS : normalizePermissions(row.permissions);
  return {
    user,
    project: row.project,
    permissions,
    can: (tool, level = "read") => levelAtLeast(permissions[tool], level),
  };
});

export async function requireTool(projectId: string, tool: Tool, level: Level = "read") {
  const access = await getProjectAccess(projectId);
  if (!access.can(tool, level)) notFound();
  return access;
}

export async function listProjectsForUser(user: CurrentUser, opts: { includeArchived?: boolean } = {}) {
  const archived = opts.includeArchived ? undefined : isNull(schema.projects.archivedAt);
  if (user.isCompanyAdmin) {
    return db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.companyId, user.companyId), archived))
      .orderBy(asc(schema.projects.name));
  }
  return db
    .select({ project: schema.projects })
    .from(schema.projects)
    .innerJoin(schema.projectMembers, eq(schema.projectMembers.projectId, schema.projects.id))
    .where(and(eq(schema.projectMembers.userId, user.id), eq(schema.projects.companyId, user.companyId), archived))
    .orderBy(asc(schema.projects.name))
    .then((rows) => rows.map((r) => r.project));
}
