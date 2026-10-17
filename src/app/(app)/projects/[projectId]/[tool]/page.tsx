import { notFound } from "next/navigation";
import { requireTool } from "@/lib/auth";
import { TOOL_LABELS } from "@/lib/permissions";
import { toolFromSlug } from "@/lib/tools";

// Placeholder for tools that haven't been built yet. Each tool replaces this
// with its own route folder (static segments take priority over [tool]).
export default async function ToolPlaceholderPage({ params }: PageProps<"/projects/[projectId]/[tool]">) {
  const { projectId, tool: slug } = await params;
  const tool = toolFromSlug(slug);
  if (!tool) notFound();
  await requireTool(projectId, tool);

  return (
    <div>
      <h1 className="text-2xl font-semibold">{TOOL_LABELS[tool]}</h1>
      <div className="card mt-6 text-sm text-zinc-500">This tool is coming soon.</div>
    </div>
  );
}
