import Link from "next/link";

import { cn } from "@/lib/utils";

const tabs = [
  { key: "courses", href: "/app/favorites/courses", label: "Cursos favoritos" },
  { key: "lessons", href: "/app/favorites/lessons", label: "Aulas favoritas" },
] as const;

export function FavoritesTabs({ active }: { active: (typeof tabs)[number]["key"] }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Link
          aria-current={tab.key === active ? "page" : undefined}
          className={cn(
            "inline-flex min-h-10 items-center rounded-md border border-stroke-subtle px-4 text-sm font-medium text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary",
            tab.key === active && "bg-brand-primary text-copy-primary",
          )}
          href={tab.href}
          key={tab.key}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
