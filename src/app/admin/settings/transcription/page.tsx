import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import {
  removeGeminiKeyAction,
  saveGeminiKeyAction,
  saveTranscriptionMethodAction,
  testGeminiKeyAction,
} from "@/server/actions/settings-actions";
import { requireRole } from "@/server/auth/guards";
import { getGeminiKeyStatus, getOpenAiKeyStatus, getTranscriptionMethod } from "@/server/services/settings-service";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const methods = [
  {
    value: "browser",
    title: "1. Navegador do aluno (gratuito) - padrao",
    how: 'O aluno clica em "Transcrever esta aula" e escolhe a aba da aula para compartilhar o audio. Enquanto o video toca, o proprio computador do aluno escuta e escreve o texto, usando um programa de inteligencia artificial (Whisper) que o navegador baixa sozinho.',
    when: "Durante a aula, em tempo real: aula de 1 hora leva 1 hora. O aluno precisa deixar a aba aberta, com som, ate o fim. Funciona no Chrome e no Edge do computador (nao no celular).",
    where: "So o texto fica salvo, no cadastro da aula, e todos os alunos passam a ver. O audio nao e gravado nem enviado para lugar nenhum.",
    cost: "R$ 0. Na primeira vez o navegador baixa o modelo (cerca de 80 a 150 MB) e usa o processador do aluno. A qualidade e media: pode errar nomes e termos tecnicos.",
  },
  {
    value: "gemini",
    title: "2. Gemini (Google) - melhor qualidade",
    how: "A gravacao e igual a do metodo 1, mas o audio vai em pedacos de 1 minuto para o nosso servidor, que pede ao Gemini (inteligencia artificial do Google) para escrever o texto. Exige a chave do Gemini abaixo.",
    when: "Tambem durante a aula, em tempo real, um minuto por vez. O aluno precisa deixar a aba aberta ate o fim, mas o computador dele nao trabalha pesado.",
    where: "So o texto fica salvo, no cadastro da aula, e todos os alunos passam a ver. O audio nao e guardado por nos: passa pelo servidor e segue para o Google.",
    cost: "A chave e sua. O Gemini tem uma faixa gratuita com limite de uso e, acima dela, cobra por uso (confira os valores atuais no site do Google). No plano gratuito o Google pode usar o conteudo enviado para melhorar seus produtos: leia os termos antes de ativar.",
  },
  {
    value: "openai",
    title: "3. OpenAI (ChatGPT)",
    how: "A gravacao e igual a dos outros metodos, mas o audio vai em pedacos de 1 minuto para o nosso servidor, que pede ao modelo gpt-4o-mini-transcribe da OpenAI para escrever o texto. Usa a mesma chave da OpenAI ja cadastrada em Configuracoes > IA nas aulas.",
    when: "Durante a aula, em tempo real, um minuto por vez. Como nos outros metodos, o aluno deixa a aba aberta ate o fim. A OpenAI nao le videos do YouTube pelo link: aulas do YouTube continuam usando a legenda do YouTube ou o Gemini.",
    where: "So o texto fica salvo, no cadastro da aula. O audio nao e guardado por nos: passa pelo servidor e segue para a OpenAI.",
    cost: "Cobrado na sua conta da OpenAI por minuto de audio (confira os valores atuais no site da OpenAI).",
  },
] as const;

export default async function TranscriptionSettingsPage(props: { searchParams: Promise<PageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  await requireRole("ADMIN");
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const [method, key, openAiKey] = await Promise.all([getTranscriptionMethod(), getGeminiKeyStatus(), getOpenAiKeyStatus()]);

  return (
    <section className="space-y-8">
      <div>
        <Link className="text-sm text-muted-foreground hover:underline" href="/admin/settings">
          Voltar para Configuracoes
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">Transcricao das aulas</h2>
        <p className="text-sm text-muted-foreground">
          Vale para aulas do Google Drive. Aulas do YouTube sempre usam a legenda do proprio YouTube, de graca, com um
          clique. Cada aula e transcrita uma unica vez: depois disso o texto fica salvo e ninguem precisa repetir.
        </p>
      </div>
      <Feedback status={status} />

      <form action={saveTranscriptionMethodAction} className="max-w-3xl space-y-4">
        {methods.map((item) => (
          <label
            className="block cursor-pointer space-y-2 rounded-md border bg-background p-4 has-[:checked]:border-primary"
            key={item.value}
          >
            <span className="flex items-center gap-2 text-base font-semibold">
              <input defaultChecked={method === item.value} name="method" type="radio" value={item.value} />
              {item.title}
            </span>
            <dl className="space-y-2 text-sm text-muted-foreground">
              <div>
                <dt className="font-medium text-foreground">Como funciona</dt>
                <dd>{item.how}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Quando transcreve</dt>
                <dd>{item.when}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Onde fica salvo</dt>
                <dd>{item.where}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Custo</dt>
                <dd>{item.cost}</dd>
              </div>
            </dl>
          </label>
        ))}
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
          Salvar metodo
        </button>
        <p className="text-sm text-muted-foreground">
          Metodo em uso agora: <strong>{method === "gemini" ? "Gemini" : method === "openai" ? "OpenAI (ChatGPT)" : "Navegador do aluno"}</strong>.
        </p>
      </form>

      <div className="max-w-3xl space-y-2 rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Chave da OpenAI</h3>
        <p className="text-sm">
          {openAiKey.configured
            ? `Chave da OpenAI ja cadastrada (${openAiKey.hint}) e em uso pelo metodo 3. `
            : "Nenhuma chave da OpenAI cadastrada. "}
          Para cadastrar ou trocar, use{" "}
          <Link className="underline" href="/admin/settings/ai">
            Configuracoes &gt; IA
          </Link>
          .
        </p>
      </div>

      <div className="max-w-3xl space-y-3 rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Chave do Gemini</h3>
        <p className="text-sm text-muted-foreground">
          Crie a chave em aistudio.google.com/apikey e cole abaixo. Fica guardada criptografada. Necessaria so para o
          metodo 2.
        </p>
        <p className="text-sm">
          {key.configured ? `Chave configurada (${key.hint}).` : "Nenhuma chave configurada."}
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
              formAction={saveGeminiKeyAction}
              type="submit"
            >
              Salvar
            </button>
            <button
              className="rounded-md border px-4 py-2 text-sm font-medium"
              formAction={testGeminiKeyAction}
              type="submit"
            >
              Testar
            </button>
          </div>
        </form>
        {key.configured ? (
          <form action={removeGeminiKeyAction}>
            <SubmitButton destructive confirmMessage="Remover a chave do Gemini?">
              Remover chave
            </SubmitButton>
          </form>
        ) : null}
      </div>
    </section>
  );
}
