"use client";

import { useActionState } from "react";
import { Field, FormMessage, Input, Select, SubmitButton, type FormState } from "@/components/form";
import { STAGES, STAGE_LABELS } from "@/lib/projects";

type ProjectValues = {
  name: string;
  number: string | null;
  stage: (typeof STAGES)[number];
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  startDate: string | null;
  completionDate: string | null;
};

export function ProjectForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: ProjectValues;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const value = (key: keyof ProjectValues) => state?.values?.[key] ?? initial?.[key] ?? "";
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Project name">
            <Input name="name" defaultValue={value("name")} required />
          </Field>
        </div>
        <Field label="Project number">
          <Input name="number" defaultValue={value("number")} />
        </Field>
      </div>
      <Field label="Stage">
        <Select name="stage" defaultValue={value("stage") || "course_of_construction"}>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Street address">
        <Input name="address" defaultValue={value("address")} autoComplete="street-address" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City">
          <Input name="city" defaultValue={value("city")} />
        </Field>
        <Field label="State">
          <Input name="state" defaultValue={value("state")} />
        </Field>
        <Field label="ZIP">
          <Input name="zip" defaultValue={value("zip")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date">
          <Input name="startDate" type="date" defaultValue={value("startDate")} />
        </Field>
        <Field label="Completion date">
          <Input name="completionDate" type="date" defaultValue={value("completionDate")} />
        </Field>
      </div>
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
