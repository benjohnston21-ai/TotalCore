"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 mt-4 flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {links.map((link, i) => {
        // "Home" only matches exactly; tools match their whole subtree.
        const active = i === 0 ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
              active
                ? "bg-orange-50 font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
