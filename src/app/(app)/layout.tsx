import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logout } from "../(auth)/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link href="/projects" className="text-lg font-bold tracking-tight">
            Total<span className="text-orange-600">Core</span>
          </Link>
          <span className="hidden truncate text-sm text-zinc-500 sm:inline">{user.companyName}</span>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-600 sm:inline dark:text-zinc-400">{user.name}</span>
            <form action={logout}>
              <button className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
