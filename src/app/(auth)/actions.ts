"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import type { FormState } from "@/components/form";
import { failure } from "@/lib/form-state";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const signupSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required"),
  name: z.string().trim().min(1, "Your name is required"),
  email,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0].message, formData);
  const input = parsed.data;

  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, input.email));
  if (existing) return failure("An account with that email already exists. Try signing in.", formData);

  const passwordHash = await hashPassword(input.password);
  const userId = await db.transaction(async (tx) => {
    const [company] = await tx.insert(schema.companies).values({ name: input.companyName }).returning();
    const [user] = await tx
      .insert(schema.users)
      .values({ email: input.email, name: input.name, passwordHash })
      .returning();
    await tx.insert(schema.companyMembers).values({ companyId: company.id, userId: user.id, role: "admin" });
    return user.id;
  });

  await createSession(userId);
  redirect("/projects");
}

const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password") });

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure(parsed.error.issues[0].message, formData);

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email));
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return failure("Email or password is incorrect", formData);
  }

  await createSession(user.id);
  redirect("/projects");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
