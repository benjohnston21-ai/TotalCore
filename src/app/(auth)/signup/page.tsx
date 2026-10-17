"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, Input, SubmitButton } from "@/components/form";
import { signup } from "../actions";

export default function SignupPage() {
  const [state, action] = useActionState(signup, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Create your company account</h1>
      <FormMessage state={state} />
      <Field label="Company name">
        <Input name="companyName" autoComplete="organization" defaultValue={state?.values?.companyName} required />
      </Field>
      <Field label="Your name">
        <Input name="name" autoComplete="name" defaultValue={state?.values?.name} required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required />
      </Field>
      <Field label="Password" hint="At least 8 characters">
        <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <SubmitButton pendingText="Creating…">Create account</SubmitButton>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-orange-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
