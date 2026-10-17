import type { FormState } from "@/components/form";

// Build a failed form state that keeps the user's input (minus passwords) so
// the form can be re-filled.
export function failure(error: string, formData?: FormData): FormState {
  if (!formData) return { error };
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.toLowerCase().includes("password") && !key.startsWith("$")) {
      values[key] = value;
    }
  }
  return { error, values };
}
