import Link from "next/link";
import { listProjectsForUser, requireUser } from "@/lib/auth";
import { STAGE_LABELS } from "@/lib/projects";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await listProjectsForUser(user);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Projects</h1>
        {user.isCompanyAdmin && (
          <Link href="/projects/new" className="btn-primary">
            New project
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center text-sm text-zinc-500">
          {user.isCompanyAdmin
            ? "No projects yet. Create your first one to get started."
            : "You haven't been added to any projects yet."}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`} className="card block h-full hover:border-orange-400">
                <p className="text-xs text-zinc-500">{p.number || "No project number"}</p>
                <p className="mt-1 font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {[p.city, p.state].filter(Boolean).join(", ") || "No location"}
                </p>
                <p className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {STAGE_LABELS[p.stage]}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
