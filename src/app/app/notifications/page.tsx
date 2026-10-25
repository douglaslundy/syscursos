import Link from "next/link";

import { EmptyState } from "@/components/student/empty-state";
import { requireAnyRole } from "@/server/auth/guards";
import { listNotifications, markAllNotificationsRead } from "@/server/services/notification-service";
import { formatDateTimeBr } from "@/lib/format-date";

const date = (iso: string) => formatDateTimeBr(iso);

export default async function NotificationsPage() {
  const user = await requireAnyRole(["STUDENT"]);
  const items = await listNotifications(user.id);

  // Abrir a pagina conta como ler: o contador do menu zera na proxima navegacao.
  await markAllNotificationsRead(user.id);

  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Avisos</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">Notificacoes</h1>
      </div>
      {items.length === 0 ? (
        <EmptyState description="Respostas as suas duvidas e lembretes de estudo aparecem aqui." title="Nenhum aviso" />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const body = (
              <>
                <p className={`text-sm ${item.read ? "text-copy-secondary" : "font-semibold text-copy-primary"}`}>{item.title}</p>
                <p className="text-xs text-copy-muted">{date(item.createdAt)}</p>
              </>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link className="block rounded-md border border-stroke-subtle bg-surface p-4 transition hover:bg-surface-hover" href={item.href}>
                    {body}
                  </Link>
                ) : (
                  <div className="rounded-md border border-stroke-subtle bg-surface p-4">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
