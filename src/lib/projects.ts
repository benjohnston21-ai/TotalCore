import { z } from "zod";

export const STAGES = [
  "bidding",
  "pre_construction",
  "course_of_construction",
  "post_construction",
  "warranty",
] as const;

export const STAGE_LABELS: Record<(typeof STAGES)[number], string> = {
  bidding: "Bidding",
  pre_construction: "Pre-Construction",
  course_of_construction: "Course of Construction",
  post_construction: "Post-Construction",
  warranty: "Warranty",
};

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null);

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Dates must be YYYY-MM-DD")
  .transform((v) => v || null);

export const projectInput = z
  .object({
    name: z.string().trim().min(1, "Project name is required"),
    number: optionalText,
    stage: z.enum(STAGES),
    address: optionalText,
    city: optionalText,
    state: optionalText,
    zip: optionalText,
    startDate: optionalDate,
    completionDate: optionalDate,
  })
  .refine((p) => !p.startDate || !p.completionDate || p.startDate <= p.completionDate, {
    message: "Completion date can't be before the start date",
  });

export type ProjectInput = z.infer<typeof projectInput>;
