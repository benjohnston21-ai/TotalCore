import Link from "next/link";
import { getProjectAccess } from "@/lib/auth";
import { TOOLS, TOOL_LABELS } from "@/lib/permissions";
import { toolHref } from "@/lib/tools";
import { ProjectNav } from "./project-nav";

export default async function ProjectLayout({ children, params }: LayoutProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const { project, can } = await getProjectAccess(projectId);

  const links = [
    { href: `/projects/${project.id}`, label: "Home" },
    ...TOOLS.filter((t) => can(t)).map((t) => ({ href: toolHref(project.id, t), label: TOOL_LABELS[t] })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row">
      <aside className="border-b border-zinc-200 px-4 py-4 md:w-56 md:shrink-0 md:border-r md:border-b-0 dark:border-zinc-800">
        <Link href="/projects" className="text-xs text-zinc-500 hover:underline">
          ← All projects
        </Link>
        <p className="mt-2 font-semibold leading-tight">{project.name}</p>
        {project.number && <p className="text-xs text-zinc-500">#{project.number}</p>}
        <ProjectNav links={links} />
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
