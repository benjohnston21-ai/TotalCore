import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getProjectAccess } from "@/lib/auth";
import { STAGE_LABELS } from "@/lib/projects";
import { TOOLS, TOOL_LABELS } from "@/lib/permissions";
import { toolHref } from "@/lib/tools";
import { updateProject } from "../actions";
import { ProjectForm } from "../project-form";

export default async function ProjectHomePage({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const { project, can } = await getProjectAccess(projectId);

  const [[{ members }], activity] = await Promise.all([
    db.select({ members: count() }).from(schema.projectMembers).where(eq(schema.projectMembers.projectId, project.id)),
    db
      .select({ event: schema.auditEvents, actor: schema.users.name })
      .from(schema.auditEvents)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditEvents.actorId))
      .where(eq(schema.auditEvents.projectId, project.id))
      .orderBy(desc(schema.auditEvents.createdAt))
      .limit(10),
  ]);

  const location = [project.address, project.city, project.state, project.zip].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p className="text-sm text-zinc-500">
          {STAGE_LABELS[project.stage]}
          {location && ` · ${location}`}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.filter((t) => can(t)).map((t) => (
          <Link key={t} href={toolHref(project.id, t)} className="card hover:border-orange-400">
            <p className="font-medium">{TOOL_LABELS[t]}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {t === "directory" ? `${members} ${members === 1 ? "person" : "people"}` : "Open"}
            </p>
          </Link>
        ))}
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-zinc-500">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
            {activity.map(({ event, actor }) => (
              <li key={event.id} className="flex justify-between gap-4 py-2">
                <span>
                  <span className="font-medium">{actor ?? "Someone"}</span> {event.action}{" "}
                  {event.itemType.replace(/_/g, " ")}
                </span>
                <time className="shrink-0 text-zinc-500" dateTime={event.createdAt.toISOString()}>
                  {event.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      {can("directory", "admin") && (
        <section className="card">
          <h2 className="mb-4 font-semibold">Project details</h2>
          <ProjectForm action={updateProject.bind(null, project.id)} initial={project} submitLabel="Save changes" />
        </section>
      )}
    </div>
  );
}
