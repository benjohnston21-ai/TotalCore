"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";

// `values` echoes back what was submitted when an action fails, because React
// resets uncontrolled forms after every action.
export type FormState = { error?: string; message?: string; values?: Record<string, string> } | undefined;

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
      {hint && <span className="text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-zinc-700 dark:bg-zinc-900";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function SubmitButton({ children, pendingText }: { children: ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        {state.error}
      </p>
    );
  }
  if (state?.message) {
    return (
      <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
        {state.message}
      </p>
    );
  }
  return null;
}
