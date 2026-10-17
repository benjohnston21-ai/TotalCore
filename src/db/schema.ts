import { relations } from "drizzle-orm";
import {
  bigint,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ToolPermissions } from "@/lib/permissions";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ---------------------------------------------------------------------------
// Companies, people and access
// ---------------------------------------------------------------------------

export const companies = pgTable("companies", {
  id: id(),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const companyRole = pgEnum("company_role", ["admin", "member"]);

// A user's membership in a company directory. Company admins can see and
// manage every project in the company.
export const companyMembers = pgTable(
  "company_members",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: companyRole("role").notNull().default("member"),
    jobTitle: text("job_title"),
    vendor: text("vendor"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.userId] })],
);

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the cookie token, so a database leak can't be replayed.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projectStage = pgEnum("project_stage", [
  "bidding",
  "pre_construction",
  "course_of_construction",
  "post_construction",
  "warranty",
]);

export const projects = pgTable(
  "projects",
  {
    id: id(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    number: text("number"),
    stage: projectStage("stage").notNull().default("course_of_construction"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    startDate: date("start_date"),
    completionDate: date("completion_date"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_company_idx").on(t.companyId)],
);

// The project directory: who is on the project and what each tool lets them do.
export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissions: jsonb("permissions").$type<ToolPermissions>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] }), index("project_members_user_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// Shared building blocks used by every tool
// ---------------------------------------------------------------------------

export const files = pgTable(
  "files",
  {
    id: id(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    contentType: text("content_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    storageKey: text("storage_key").notNull(),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("files_project_idx").on(t.projectId)],
);

// Attach any file to any item (an RFI, a submittal, a daily log entry...).
export const attachments = pgTable(
  "attachments",
  {
    id: id(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    itemId: uuid("item_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("attachments_item_idx").on(t.itemType, t.itemId)],
);

// Two-way links between items, e.g. an RFI pinned to a drawing sheet.
export const itemLinks = pgTable(
  "item_links",
  {
    id: id(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fromType: text("from_type").notNull(),
    fromId: uuid("from_id").notNull(),
    toType: text("to_type").notNull(),
    toId: uuid("to_id").notNull(),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("item_links_from_idx").on(t.fromType, t.fromId), index("item_links_to_idx").on(t.toType, t.toId)],
);

// Change history for every item. `changes` holds { field: [before, after] }.
export const auditEvents = pgTable(
  "audit_events",
  {
    id: id(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    itemType: text("item_type").notNull(),
    itemId: uuid("item_id").notNull(),
    action: text("action").notNull(),
    changes: jsonb("changes").$type<Record<string, [unknown, unknown]>>(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_events_item_idx").on(t.itemType, t.itemId), index("audit_events_project_idx").on(t.projectId)],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const companiesRelations = relations(companies, ({ many }) => ({
  members: many(companyMembers),
  projects: many(projects),
}));

export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companyMembers),
  projects: many(projectMembers),
}));

export const companyMembersRelations = relations(companyMembers, ({ one }) => ({
  company: one(companies, { fields: [companyMembers.companyId], references: [companies.id] }),
  user: one(users, { fields: [companyMembers.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, { fields: [projects.companyId], references: [companies.id] }),
  members: many(projectMembers),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));
