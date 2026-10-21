import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  removeGoogleKeyAction,
  saveGoogleKeyAction,
  testGoogleKeyAction,
} from "@/server/actions/settings-actions";
import { requireRole } from "@/server/auth/guards";
import { getGoogleKeyStatus } from "@/server/services/settings-service";

type SettingsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AdminSettingsPage(props: { searchParams: Promise<SettingsPageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  await requireRole("ADMIN");
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const key = await getGoogleKeyStatus();

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Configuracoes</h2>
        <p className="text-sm text-muted-foreground">Chave do Google e backup do sistema.</p>
      </div>
      <Feedback status={status} />

      <div className="max-w-2xl space-y-3 rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Google API Key (Drive)</h3>
        <p className="text-sm text-muted-foreground">
          Usada para ler a duracao das aulas hospedadas no Google Drive. Crie a chave no Google Cloud, ative a Drive
          API e deixe os videos compartilhados por link.
        </p>
        <p className="text-sm">
          {key.configured
            ? `Chave configurada (${key.hint}) - origem: ${key.source === "ui" ? "este painel" : "variavel de ambiente"}.`
            : "Nenhuma chave configurada."}
          {key.unreadable ? " A chave salva nao pode mais ser lida; informe-a de novo." : ""}
        </p>
        <form className="grid gap-3">
          <input
            autoComplete="off"
            className="rounded-md border px-3 py-2 text-sm outline-none"
            name="apiKey"
            placeholder="Cole a chave (deixe vazio para testar a chave atual)"
            type="password"
          />
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              formAction={saveGoogleKeyAction}
              type="submit"
            >
              Salvar
            </button>
            <button
              className="rounded-md border px-4 py-2 text-sm font-medium"
              formAction={testGoogleKeyAction}
              type="submit"
            >
              Testar
            </button>
          </div>
        </form>
        {key.source === "ui" ? (
          <form action={removeGoogleKeyAction}>
            <SubmitButton destructive confirmMessage="Remover a chave salva?">
              Remover chave
            </SubmitButton>
          </form>
        ) : null}
      </div>

      <div className="max-w-2xl space-y-3 rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Transcricao das aulas</h3>
        <p className="text-sm text-muted-foreground">
          Escolha como as aulas do Google Drive sao transcritas (navegador do aluno, gratuito, ou Gemini) e cadastre a
          chave do Gemini.
        </p>
        <Link
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          href="/admin/settings/transcription"
        >
          Configurar transcricao
        </Link>
      </div>

      <div className="max-w-2xl space-y-3 rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Inteligencia artificial (resumos e flashcards)</h3>
        <p className="text-sm text-muted-foreground">
          Cadastre as chaves da OpenAI e do Gemini, escolha qual esta ativa e quais tecnicas de resumo os alunos podem
          usar. Tambem mostra o consumo de tokens por mes, IA, curso e aluno.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            href="/admin/settings/ai"
          >
            Configurar IA
          </Link>
          <Link className="inline-block rounded-md border px-4 py-2 text-sm font-medium" href="/admin/settings/ai-usage">
            Consumo de tokens
          </Link>
        </div>
      </div>

      <div className="max-w-2xl space-y-3 rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Backup</h3>
        <p className="text-sm text-muted-foreground">
          Baixa um arquivo .json.gz com todos os dados do banco (usuarios, cursos, aulas, matriculas, progresso, notas,
          favoritos e planos). Nao inclui senhas (ficam no Supabase Auth) nem a chave do Google. Para restaurar:
          <code className="ml-1 rounded bg-muted px-1">npm run db:restore -- arquivo.json.gz</code>.
        </p>
        <a
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          download
          href="/admin/backup"
        >
          Backup
        </a>
      </div>
    </section>
  );
}
