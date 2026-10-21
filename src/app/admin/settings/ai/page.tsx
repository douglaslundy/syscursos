import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import { SUMMARY_TECHNIQUES } from "@/lib/ai/techniques";
import {
  removeOpenAiKeyAction,
  saveActiveProviderAction,
  saveAiKeyAction,
  saveTechniquesAction,
  testAiKeyAction,
} from "@/server/actions/ai-actions";
import { requireRole } from "@/server/auth/guards";
import { getAiSettingsStatus } from "@/server/services/ai/ai-settings-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const providers = [
  { id: "openai", title: "OpenAI (ChatGPT)", help: "Crie a chave em platform.openai.com/api-keys. Modelo usado: gpt-4o-mini." },
  {
    id: "gemini",
    title: "Google Gemini",
    help: "Crie a chave em aistudio.google.com/apikey. E a mesma chave usada na transcricao das aulas. Modelo usado: gemini-2.5-flash.",
  },
] as const;

export default async function AiSettingsPage(props: { searchParams: Promise<PageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  await requireRole("ADMIN");
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const settings = await getAiSettingsStatus();

  return (
    <section className="space-y-8">
      <div>
        <Link className="text-sm text-muted-foreground hover:underline" href="/admin/settings">
          Voltar para Configuracoes
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">Inteligencia artificial nas aulas</h2>
        <p className="text-sm text-muted-foreground">
          Resumos, flashcards e mapas mentais gerados a partir da transcricao. Cada conteudo e gerado uma unica vez por
          aula (e por tecnica, no caso do resumo): depois fica salvo e e reaproveitado por todos os alunos, sem gastar
          tokens de novo. Se a transcricao for apagada, o conteudo gerado a partir dela tambem e.
        </p>
        <Link className="mt-2 inline-block text-sm font-medium underline" href="/admin/settings/ai-usage">
          Ver consumo de tokens
        </Link>
      </div>
      <Feedback status={status} />

      {providers.map((provider) => {
        const key = settings[provider.id];

        return (
          <div className="max-w-3xl space-y-3 rounded-md border bg-background p-4" key={provider.id}>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              {provider.title}
              {settings.active === provider.id ? (
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Ativa</span>
              ) : null}
            </h3>
            <p className="text-sm text-muted-foreground">{provider.help} A chave fica guardada criptografada.</p>
            <p className="text-sm">
              {key.configured ? `Chave configurada (${key.hint}).` : "Nenhuma chave configurada."}
              {key.unreadable ? " A chave salva nao pode mais ser lida; informe-a de novo." : ""}
            </p>
            <form className="grid gap-3">
              <input name="provider" type="hidden" value={provider.id} />
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
                  formAction={saveAiKeyAction}
                  type="submit"
                >
                  Salvar
                </button>
                <button className="rounded-md border px-4 py-2 text-sm font-medium" formAction={testAiKeyAction} type="submit">
                  Testar
                </button>
                {key.configured && settings.active !== provider.id ? (
                  <button className="rounded-md border px-4 py-2 text-sm font-medium" formAction={saveActiveProviderAction} type="submit">
                    Ativar esta IA
                  </button>
                ) : null}
              </div>
            </form>
            {provider.id === "openai" && key.configured ? (
              <form action={removeOpenAiKeyAction}>
                <SubmitButton destructive confirmMessage="Remover a chave da OpenAI?">
                  Remover chave
                </SubmitButton>
              </form>
            ) : null}
          </div>
        );
      })}
      <p className="max-w-3xl text-sm text-muted-foreground">
        IA em uso agora:{" "}
        <strong>
          {settings.active === "openai" ? "OpenAI" : settings.active === "gemini" ? "Gemini" : "nenhuma (os botoes de IA ficam indisponiveis para os alunos)"}
        </strong>
        . Para remover a chave do Gemini, use a tela de transcricao.
      </p>

      <form action={saveTechniquesAction} className="max-w-3xl space-y-4 rounded-md border bg-background p-4">
        <div>
          <h3 className="text-base font-semibold">Tecnicas de resumo</h3>
          <p className="text-sm text-muted-foreground">
            Marque as tecnicas que o aluno poderá escolher. Com mais de uma ativa, ele escolhe qual usar a cada resumo;
            cada tecnica gera e guarda o seu proprio resumo da aula.
          </p>
        </div>
        {SUMMARY_TECHNIQUES.map((technique) => (
          <label className="block cursor-pointer space-y-1 rounded-md border p-3 has-[:checked]:border-primary" key={technique.id}>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <input defaultChecked={settings.techniques.includes(technique.id)} name="technique" type="checkbox" value={technique.id} />
              {technique.label}
            </span>
            <span className="block text-sm text-muted-foreground">{technique.description}</span>
            <span className="block text-xs text-muted-foreground">Base: {technique.evidence}</span>
          </label>
        ))}
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Salvar tecnicas
        </button>
        {settings.techniques.length === 0 ? (
          <p className="text-sm text-destructive">Nenhuma tecnica ativa: os alunos nao conseguem gerar resumos nem mapas mentais.</p>
        ) : null}
      </form>
    </section>
  );
}
