// Recursos que o admin pode ligar/desligar em /admin/settings/features. Tudo comeca ligado.
export type FeatureGroup = "student" | "agent";

export type FeatureDef = { id: string; group: FeatureGroup; label: string; description: string; href?: string };

export const STUDENT_FEATURES: FeatureDef[] = [
  { id: "search", group: "student", label: "Buscar", description: "Busca em cursos e aulas.", href: "/app/search" },
  { id: "review", group: "student", label: "Revisao", description: "Baralho com repeticao espacada.", href: "/app/review" },
  { id: "quiz", group: "student", label: "Quiz", description: "Quiz dos cursos e das aulas.", href: "/app/quiz" },
  { id: "progress", group: "student", label: "Progresso", description: "Estatisticas e meta semanal.", href: "/app/progress" },
  { id: "schedule", group: "student", label: "Cronograma", description: "Plano de estudo e calendario.", href: "/app/schedule" },
  { id: "notebooks", group: "student", label: "Cadernos", description: "Anotacoes dos alunos.", href: "/app/notebooks" },
  { id: "favorites", group: "student", label: "Favoritos", description: "Cursos e aulas favoritos.", href: "/app/favorites/courses" },
  { id: "playlists", group: "student", label: "Playlists", description: "Playlists de aulas.", href: "/app/playlists" },
];

export const AGENT_FEATURES: FeatureDef[] = [
  ["list_courses", "Listar cursos"],
  ["start_session", "Iniciar quiz ou revisao"],
  ["submit_quiz", "Enviar respostas do quiz"],
  ["answer_card", "Responder cartao do baralho"],
  ["rate_card", "Avaliar cartao do baralho"],
  ["list_lessons", "Listar aulas"],
  ["get_material", "Ler resumo, mapa ou transcricao"],
  ["generate_material", "Gerar material com IA (gasta IA)"],
  ["transcribe_lesson", "Transcrever aula"],
  ["ask_lesson", "Perguntar sobre a aula (gasta IA)"],
].map(([name, label]) => ({ id: `agent:${name}`, group: "agent" as const, label: name, description: label }));

export const ALL_FEATURES = [...STUDENT_FEATURES, ...AGENT_FEATURES];

export const featureIds = new Set(ALL_FEATURES.map((feature) => feature.id));

// Guarda so ids conhecidos; lixo no banco nunca derruba a tela.
export function parseDisabled(raw: string | null | undefined): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");

    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && featureIds.has(item)) : [];
  } catch {
    return [];
  }
}
