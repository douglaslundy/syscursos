import Link from "next/link";
import { Nunito, Sora } from "next/font/google";
import { ArrowRight, BookOpen, CheckCircle2, Lock, PlayCircle, Shield, Users } from "lucide-react";

const headingFont = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const bodyFont = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function HomePage() {
  return (
    <main className={`${bodyFont.className} min-h-screen bg-background text-copy-primary`}>
      <section className="relative overflow-hidden border-b border-stroke-subtle bg-gradient-to-b from-surface-elevated via-background to-background px-6 pb-16 pt-14 md:pb-24 md:pt-20">
        <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-brand-primary/15 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">SysCursos</p>
          <h1
            className={`${headingFont.className} mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-6xl`}
          >
            Venda, organize e entregue seus cursos com estrutura profissional de verdade
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-copy-secondary md:text-xl">
            Plataforma completa para operação de cursos online com gestão administrativa, segurança de
            acesso e experiência de aprendizagem focada em progresso real do aluno.
          </p>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 md:flex md:flex-wrap">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand-primary px-5 text-sm font-bold text-copy-primary transition hover:bg-brand-primaryHover"
              href="/login/client"
            >
              Sou cliente
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-5 text-sm font-bold text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
              href="/login/admin"
            >
              Sou administrador
            </Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Pill label="Gestão completa de cursos, módulos e aulas" />
            <Pill label="Controle de matrícula com expiração e cancelamento" />
            <Pill label="Área do aluno com progresso e cadernos" />
            <Pill label="Segurança em camadas com RBAC e validação server-side" />
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            description="Cadastre cursos, módulos e aulas com ordenação e status ativo/inativo para controlar publicação."
            icon={<BookOpen className="h-5 w-5" />}
            title="Catálogo de cursos estruturado"
          />
          <FeatureCard
            description="Use links do YouTube com validação para manter padrão, estabilidade e consistência de conteúdo."
            icon={<PlayCircle className="h-5 w-5" />}
            title="Aulas com vídeo integrado"
          />
          <FeatureCard
            description="Gerencie alunos, matrículas, início, expiração, renovação e cancelamento em fluxo administrativo único."
            icon={<Users className="h-5 w-5" />}
            title="Gestão de alunos e matrículas"
          />
          <FeatureCard
            description="Aluno acompanha progresso por curso, marca aulas concluídas e navega por trilha com fluxo de continuidade."
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Progresso e continuidade"
          />
          <FeatureCard
            description="Caderno por curso com anotações por aula, busca e visualização em formato markdown corrido."
            icon={<BookOpen className="h-5 w-5" />}
            title="Cadernos de estudo"
          />
          <FeatureCard
            description="Upload de capa para cursos com storage centralizado e exibição elegante no dashboard do aluno."
            icon={<Shield className="h-5 w-5" />}
            title="Biblioteca com identidade visual"
          />
        </div>
      </section>

      <section className="border-y border-stroke-subtle bg-surface px-6 py-14 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-stroke-subtle bg-background p-6">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">Para operação</p>
            <h2 className={`${headingFont.className} mt-2 text-2xl font-bold`}>
              Admin com fluxo direto e sem ruído
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-copy-secondary">
              <li>CRUD completo de cursos, módulos, aulas e alunos.</li>
              <li>Busca, filtro e paginação nas listagens principais.</li>
              <li>Controle de acesso por status de usuário e matrícula.</li>
              <li>Feedback padronizado para sucesso, conflito e validação.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-stroke-subtle bg-background p-6">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">Para aprendizagem</p>
            <h2 className={`${headingFont.className} mt-2 text-2xl font-bold`}>
              Experiência de estudo orientada a resultado
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-copy-secondary">
              <li>Área de aluno limpa com cursos liberados e bloqueios consistentes.</li>
              <li>Navegação por módulos e aulas com estados concluída/pendente.</li>
              <li>Cadernos com conteúdo consolidado por curso e aula.</li>
              <li>Proteção contra acesso a conteúdo fora da matrícula ativa.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl rounded-2xl border border-stroke-subtle bg-surface-elevated p-8 md:p-10">
          <p className="inline-flex items-center gap-2 rounded-md border border-stroke-subtle bg-background px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-copy-secondary">
            <Lock className="h-3.5 w-3.5" />
            Segurança e controle
          </p>
          <h2 className={`${headingFont.className} mt-4 text-3xl font-bold md:text-4xl`}>
            Estrutura segura para escalar operação sem improviso
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-copy-secondary md:text-base">
            A plataforma aplica autorização por papel, validações no servidor e bloqueio de conteúdo por
            matrícula, status e expiração. Isso reduz risco operacional e aumenta confiança para escalar.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-brand-primary px-5 text-sm font-bold text-copy-primary transition hover:bg-brand-primaryHover"
              href="/login/admin"
            >
              Entrar no painel admin
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-stroke-subtle bg-transparent px-5 text-sm font-bold text-copy-secondary transition hover:bg-surface-hover hover:text-copy-primary"
              href="/login/client"
            >
              Entrar na área do aluno
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

type PillProps = {
  label: string;
};

function Pill({ label }: PillProps) {
  return (
    <div className="rounded-md border border-stroke-subtle bg-background px-4 py-3 text-xs font-semibold tracking-[0.04em] text-copy-secondary md:text-sm">
      {label}
    </div>
  );
}

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-stroke-subtle bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary/50 hover:bg-surface-hover">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stroke-subtle bg-background text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-copy-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-copy-secondary">{description}</p>
    </article>
  );
}
