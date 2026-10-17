import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser, getProjectAccess } from "@/lib/auth";
import { storage } from "@/lib/storage";

export async function GET(request: Request, ctx: RouteContext<"/api/files/[fileId]">) {
  const { fileId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(fileId)) return new Response("Not found", { status: 404 });

  const [file] = await db.select().from(schema.files).where(eq(schema.files.id, fileId));
  if (!file || file.companyId !== user.companyId) return new Response("Not found", { status: 404 });
  // Project files are visible to anyone on the project; getProjectAccess
  // throws a 404 for everyone else.
  if (file.projectId) await getProjectAccess(file.projectId);

  const body = await storage().get(file.storageKey);
  const download = new URL(request.url).searchParams.has("download");
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      // Uploaded HTML or SVG must never run scripts on our origin.
      "Content-Security-Policy": "sandbox",
    },
  });
}
