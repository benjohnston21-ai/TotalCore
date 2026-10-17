import { requireCompanyAdmin } from "@/lib/auth";
import { createProject } from "../actions";
import { ProjectForm } from "../project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  await requireCompanyAdmin();
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">New project</h1>
      <div className="card">
        <ProjectForm action={createProject} submitLabel="Create project" />
      </div>
    </main>
  );
}
