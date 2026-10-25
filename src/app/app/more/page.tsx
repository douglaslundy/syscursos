import Link from "next/link";

import { getHiddenStudentHrefs } from "@/server/services/feature-service";

const links = [
  { href: "/app/notifications", label: "Avisos", hint: "Respostas as suas duvidas e lembretes" },
  { href: "/app/me", label: "Meus dados", hint: "Perfil e preferencias" },
  { href: "/app/quiz", label: "Quiz", hint: "Responda os quizzes de um curso" },
  { href: "/app/notebooks", label: "Cadernos", hint: "Suas anotacoes por curso e aula" },
  { href: "/app/favorites/courses", label: "Favoritos", hint: "Cursos e aulas marcados" },
  { href: "/app/playlists", label: "Playlists", hint: "Trilhas de aulas montadas por voce" },
  { href: "/app/schedule", label: "Cronograma", hint: "Plano de estudo por dia" },
];

export default async function MorePage() {
  const hidden = await getHiddenStudentHrefs();

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-normal">Mais</h1>
      <ul className="mt-6 grid gap-3">
        {links.filter((item) => !hidden.includes(item.href)).map((item) => (
          <li key={item.href}>
            <Link className="block rounded-md border border-stroke-subtle bg-surface p-4 transition hover:bg-surface-hover" href={item.href}>
              <p className="text-sm font-semibold text-copy-primary">{item.label}</p>
              <p className="text-xs text-copy-secondary">{item.hint}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
