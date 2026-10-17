"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, Input, SubmitButton } from "@/components/form";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Sign in</h1>
      <FormMessage state={state} />
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-center text-sm text-zinc-500">
        New company?{" "}
        <Link href="/signup" className="font-medium text-orange-600 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
