// Creates a demo company, admin login and project for local development.
// Usage: npm run db:seed
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { hashPassword } from "../src/lib/password";
import { PERMISSION_TEMPLATES } from "../src/lib/permissions";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  const [company] = await db.insert(schema.companies).values({ name: "Demo Builders" }).returning();
  const [admin] = await db
    .insert(schema.users)
    .values({ email: "admin@example.com", name: "Demo Admin", passwordHash: await hashPassword("password123") })
    .returning();
  await db.insert(schema.companyMembers).values({ companyId: company.id, userId: admin.id, role: "admin", jobTitle: "Project Executive" });
  const [project] = await db
    .insert(schema.projects)
    .values({ companyId: company.id, name: "Riverside Medical Office", number: "2026-014", city: "Portland", state: "OR" })
    .returning();
  await db.insert(schema.projectMembers).values({ projectId: project.id, userId: admin.id, permissions: PERMISSION_TEMPLATES.project_admin.permissions });
  console.log("Seeded. Sign in as admin@example.com / password123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
