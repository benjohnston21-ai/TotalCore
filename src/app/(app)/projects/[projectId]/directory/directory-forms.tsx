"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, Input, Select, SubmitButton } from "@/components/form";
import { LEVELS, TOOLS, TOOL_LABELS, type ToolPermissions } from "@/lib/permissions";
import { addProjectMember, removeProjectMember, updateMemberPermissions } from "../../actions";

export function AddMemberForm({
  projectId,
  templates,
}: {
  projectId: string;
  templates: { value: string; label: string }[];
}) {
  const [state, action] = useActionState(addProjectMember.bind(null, projectId), undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Email">
          <Input name="email" type="email" defaultValue={state?.values?.email} required />
        </Field>
        <Field label="Name" hint="Only needed if they're new to your company">
          <Input name="name" defaultValue={state?.values?.name} />
        </Field>
        <Field label="Permission template">
          <Select name="template" defaultValue={state?.values?.template ?? "subcontractor"}>
            {templates.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div>
        <SubmitButton pendingText="Adding…">Add to project</SubmitButton>
      </div>
    </form>
  );
}

const LEVEL_LABELS = { none: "None", read: "Read", standard: "Standard", admin: "Admin" } as const;

type Member = {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  vendor: string | null;
  permissions: ToolPermissions;
};

export function MemberRow({
  projectId,
  member,
  editable,
  isSelf,
}: {
  projectId: string;
  member: Member;
  editable: boolean;
  isSelf: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(updateMemberPermissions.bind(null, projectId, member.id), undefined);
  const summary = TOOLS.filter((t) => member.permissions[t] !== "none")
    .map((t) => `${TOOL_LABELS[t]}: ${LEVEL_LABELS[member.permissions[t]]}`)
    .join(" · ");

  return (
    <>
      <tr>
        <td className="px-5 py-3">
          <p className="font-medium">
            {member.name}
            {isSelf && <span className="ml-1 text-xs font-normal text-zinc-500">(you)</span>}
          </p>
          {(member.jobTitle || member.vendor) && (
            <p className="text-xs text-zinc-500">{[member.jobTitle, member.vendor].filter(Boolean).join(" · ")}</p>
          )}
        </td>
        <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">{member.email}</td>
        <td className="px-5 py-3 text-xs text-zinc-500">{summary || "No access"}</td>
        <td className="px-5 py-3 text-right whitespace-nowrap">
          {editable && (
            <button onClick={() => setEditing(!editing)} className="text-sm text-orange-600 hover:underline">
              {editing ? "Close" : "Edit access"}
            </button>
          )}
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={4} className="bg-zinc-50 px-5 py-4 dark:bg-zinc-950">
            <form action={action} className="flex flex-col gap-4">
              <FormMessage state={state} />
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {TOOLS.map((t) => (
                  <Field key={t} label={TOOL_LABELS[t]}>
                    <Select name={t} defaultValue={member.permissions[t]}>
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>
                          {LEVEL_LABELS[l]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <SubmitButton>Save access</SubmitButton>
                {!isSelf && (
                  <button
                    type="submit"
                    formAction={removeProjectMember.bind(null, projectId, member.id)}
                    className="btn-secondary text-red-600"
                  >
                    Remove from project
                  </button>
                )}
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
