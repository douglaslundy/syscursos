"use client";

import { BarChart3, Bell, Brain, FileText, Home, ListVideo, MoreHorizontal, Search, Star, User } from "lucide-react";
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
    href: "/app/search",
    label: "Buscar",
    icon: Search,
    match: (pathname: string) => pathname.startsWith("/app/search"),
  },
  {
    href: "/app/review",
    label: "Revisao",
    icon: Brain,
    match: (pathname: string) => pathname.startsWith("/app/review"),
  },
  {
    href: "/app/progress",
    label: "Progresso",
    icon: BarChart3,
    match: (pathname: string) => pathname.startsWith("/app/progress"),
  },
  {
    href: "/app/notebooks",
    label: "Cadernos",
    icon: FileText,
    match: (pathname: string) => pathname.startsWith("/app/notebooks"),
  },
  {
    href: "/app/favorites/courses",
    label: "Favoritos",
    icon: Star,
    match: (pathname: string) => pathname.startsWith("/app/favorites"),
  },
  {
    href: "/app/playlists",
    label: "Playlists",
    icon: ListVideo,
    match: (pathname: string) => pathname.startsWith("/app/playlists"),
  },
  {
    href: "/app/notifications",
    label: "Avisos",
    icon: Bell,
    match: (pathname: string) => pathname.startsWith("/app/notifications"),
  },
  {
    href: "/app/me",
    label: "Meus dados",
    icon: User,
    match: (pathname: string) => pathname.startsWith("/app/me"),
  },
] as const;

// Celular: 4 atalhos + "Mais" (que lista o resto), para a barra inferior nao ficar apertada.
const bottomHrefs = ["/app", "/app/search", "/app/review", "/app/progress"];
const bottomItems = navigationItems.filter((item) => bottomHrefs.includes(item.href));

export function StudentDesktopNavigation({ unread = 0 }: { unread?: number }) {
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
              "flex min-h-11 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium text-copy-secondary transition duration-200 hover:border-stroke-subtle hover:bg-surface-hover hover:text-copy-primary",
              isActive &&
                "border-l-4 border-l-brand-primary bg-surface-hover text-copy-primary shadow-[inset_0_0_0_1px_rgba(255,77,0,0.14)] hover:border-l-brand-primary hover:bg-surface-hover",
            )}
            href={item.href}
            key={item.href}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.label}
            {item.href === "/app/notifications" && unread > 0 ? (
              <span className="ml-auto rounded-full bg-brand-primary px-2 text-xs text-copy-primary">{unread}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function StudentBottomNavigation({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegacao principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stroke-subtle bg-surface-elevated/95 px-3 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.24)] backdrop-blur md:hidden"
    >
      <div className="mx-auto grid max-w-sm grid-cols-5 gap-2">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center rounded-md text-xs font-medium text-copy-secondary transition duration-200 hover:bg-surface-hover hover:text-copy-primary",
                isActive && "bg-brand-primary text-copy-primary",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <Link
          aria-current={pathname.startsWith("/app/more") ? "page" : undefined}
          className={cn(
            "relative flex min-h-12 flex-col items-center justify-center rounded-md text-xs font-medium text-copy-secondary transition duration-200 hover:bg-surface-hover hover:text-copy-primary",
            pathname.startsWith("/app/more") && "bg-brand-primary text-copy-primary",
          )}
          href="/app/more"
        >
          <MoreHorizontal aria-hidden="true" className="mb-1 h-4 w-4" />
          Mais
          {unread > 0 ? <span className="absolute right-3 top-1 h-2 w-2 rounded-full bg-brand-primary" /> : null}
        </Link>
      </div>
    </nav>
  );
}
