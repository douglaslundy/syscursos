import Link from "next/link";

export default async function AdminPage() {
  const { getAdminDashboard } = await import("@/server/services/admin-service");
  const stats = await getAdminDashboard();
  const cards = [
    { label: "Cursos", value: stats.courses, href: "/admin/courses" },
    { label: "Alunos", value: stats.students, href: "/admin/students" },
    { label: "Matriculas ativas", value: stats.enrollments, href: "/admin/enrollments" },
    { label: "Aulas", value: stats.lessons, href: "/admin/courses" },
  ];

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">Dashboard administrativo</h2>
        <p className="text-sm text-muted-foreground">Resumo operacional da plataforma.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Link
            className="rounded-md border bg-background p-4 hover:bg-muted/60"
            href={card.href}
            key={card.label}
          >
            <div className="text-sm text-muted-foreground">{card.label}</div>
            <div className="mt-2 text-3xl font-semibold">{card.value}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
