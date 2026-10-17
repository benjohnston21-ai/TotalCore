import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireTool } from "@/lib/auth";
import { normalizePermissions, PERMISSION_TEMPLATES } from "@/lib/permissions";
import { AddMemberForm, MemberRow } from "./directory-forms";

export const metadata = { title: "Directory" };

export default async function DirectoryPage({ params }: PageProps<"/projects/[projectId]/directory">) {
  const { projectId } = await params;
  const { project, user, can } = await requireTool(projectId, "directory");
  const isAdmin = can("directory", "admin");

  const members = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      jobTitle: schema.companyMembers.jobTitle,
      vendor: schema.companyMembers.vendor,
      permissions: schema.projectMembers.permissions,
    })
    .from(schema.projectMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.projectMembers.userId))
    .leftJoin(
      schema.companyMembers,
      and(eq(schema.companyMembers.userId, schema.users.id), eq(schema.companyMembers.companyId, project.companyId)),
    )
    .where(eq(schema.projectMembers.projectId, project.id))
    .orderBy(asc(schema.users.name));

  const templates = Object.entries(PERMISSION_TEMPLATES).map(([value, t]) => ({ value, label: t.label }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Directory</h1>

      {isAdmin && (
        <section className="card">
          <h2 className="mb-4 font-semibold">Add a person</h2>
          <AddMemberForm projectId={project.id} templates={templates} />
        </section>
      )}

      <section className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Access</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                projectId={project.id}
                member={{ ...m, permissions: normalizePermissions(m.permissions) }}
                editable={isAdmin}
                isSelf={m.id === user.id}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
