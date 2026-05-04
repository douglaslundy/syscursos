"use client";

import { FileText, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/app",
    label: "Cursos",
    icon: Home,
    match: (pathname: string) => pathname === "/app" || pathname.startsWith("/app/courses"),
  },
  {
    href: "/app/notebooks",
    label: "Cadernos",
    icon: FileText,
    match: (pathname: string) => pathname.startsWith("/app/notebooks"),
  },
] as const;

export function StudentDesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegacao principal" className="mt-8 space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.match(pathname);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
              isActive &&
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StudentBottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegacao principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-3 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center rounded-md text-xs font-medium text-muted-foreground",
                isActive && "bg-primary text-primary-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
