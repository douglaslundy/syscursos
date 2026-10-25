import Link from "next/link";

import { Feedback } from "@/components/admin/feedback";
import { SubmitButton } from "@/components/admin/submit-button";
import { AGENT_FEATURES, STUDENT_FEATURES, type FeatureDef } from "@/lib/features";
import { saveFeatureAction } from "@/server/actions/feature-actions";
import { requireRole } from "@/server/auth/guards";
import { getDisabledFeatures } from "@/server/services/feature-service";

type PageProps = { searchParams?: Record<string, string | string[] | undefined> };

function FeatureList({ items, disabled }: { items: FeatureDef[]; disabled: Set<string> }) {
  return (
    <ul className="divide-y rounded-md border bg-background">
      {items.map((feature) => {
        const on = !disabled.has(feature.id);

        return (
          <li className="flex flex-wrap items-center justify-between gap-3 p-3" key={feature.id}>
            <div>
              <p className="text-sm font-medium">{feature.label}</p>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
            <form action={saveFeatureAction} className="flex items-center gap-3">
              <input name="id" type="hidden" value={feature.id} />
              <input name="enabled" type="hidden" value={on ? "false" : "true"} />
              <span className="text-sm">{on ? "Ligado" : "Desligado"}</span>
              <SubmitButton>{on ? "Desligar" : "Ligar"}</SubmitButton>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

export default async function FeaturesPage(props: { searchParams: Promise<PageProps["searchParams"]> }) {
  const searchParams = await props.searchParams;
  await requireRole("ADMIN");
  const status = typeof searchParams?.status === "string" ? searchParams.status : undefined;
  const disabled = await getDisabledFeatures();

  return (
    <section className="max-w-2xl space-y-8">
      <div>
        <Link className="text-sm text-muted-foreground underline" href="/admin/settings">
          Voltar para configuracoes
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-normal">Recursos</h2>
        <p className="text-sm text-muted-foreground">Ligue ou desligue recursos para todos os alunos. Tudo comeca ligado.</p>
      </div>
      <Feedback status={status} />

      <div className="space-y-2">
        <h3 className="text-base font-semibold">Menu do aluno</h3>
        <p className="text-sm text-muted-foreground">Desligado: some do menu e a pagina deixa de abrir (404).</p>
        <FeatureList disabled={disabled} items={STUDENT_FEATURES} />
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold">Ferramentas do agente WhatsApp</h3>
        <p className="text-sm text-muted-foreground">
          Desligada: some da lista do agente e a chamada devolve erro. Vincular o WhatsApp (link_whatsapp) fica sempre ligado.
          O agente so percebe a mudanca ao reconectar o servidor MCP.
        </p>
        <FeatureList disabled={disabled} items={AGENT_FEATURES} />
      </div>
    </section>
  );
}
