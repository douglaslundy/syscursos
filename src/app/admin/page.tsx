import Link from "next/link";

export default async function AdminPage() {
  const { requireAnyRole } = await import("@/server/auth/guards");
  const { getAdminDashboard } = await import("@/server/services/admin-service");
  const user = await requireAnyRole(["ADMIN", "PRODUCER"]);
  const dashboard = await getAdminDashboard();
  const cards =
    user.role === "ADMIN"
      ? [
          { label: "Produtores", value: dashboard.producers, href: "/admin/users" },
          { label: "Alunos", value: dashboard.students, href: "/admin/students" },
          { label: "Matriculas ativas", value: dashboard.enrollments, href: "/admin/enrollments" },
        ]
      : [
          { label: "Cursos", value: dashboard.courses, href: "/admin/courses" },
          { label: "Alunos", value: dashboard.students, href: "/admin/students" },
          { label: "Matriculas ativas", value: dashboard.enrollments, href: "/admin/enrollments" },
          { label: "Aulas", value: dashboard.lessons, href: "/admin/courses" },
        ];

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-normal">
          {user.role === "ADMIN" ? "Dashboard do administrador" : "Dashboard do produtor"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {user.role === "ADMIN"
            ? "Gestao de produtores e visao consolidada da operacao."
            : "Gestao dos seus cursos, aulas, alunos e matriculas."}
        </p>
        {user.role === "ADMIN" ? (
          <div className="mt-3">
            <Link
              className="inline-flex items-center rounded-md border border-stroke-subtle px-3 py-2 text-sm text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
              href="/admin/users"
            >
              Cadastrar novo produtor
            </Link>
          </div>
        ) : null}
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
      <div className="mt-8 rounded-md border bg-background p-4">
        <h3 className="text-lg font-semibold">Consumo por aluno</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {user.role === "ADMIN"
            ? "Dados consolidados dos alunos vinculados aos produtores."
            : "Dados dos alunos vinculados ao seu produtor."}
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Aluno</th>
                <th className="py-2 pr-3">E-mail</th>
                <th className="py-2 pr-3">Matriculas ativas</th>
                <th className="py-2 pr-3">Matriculas totais</th>
                <th className="py-2">Aulas concluidas</th>
                <th className="py-2">Ultimo acesso</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.studentConsumption.map((item) => (
                <tr className="border-b border-stroke-subtle" key={item.studentId}>
                  <td className="py-2 pr-3">{item.name}</td>
                  <td className="py-2 pr-3">{item.email}</td>
                  <td className="py-2 pr-3">{item.activeEnrollments}</td>
                  <td className="py-2 pr-3">{item.totalEnrollments}</td>
                  <td className="py-2">{item.completedLessons}</td>
                  <td className="py-2">
                    {item.lastLoginAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(item.lastLoginAt) : "Nunca"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
