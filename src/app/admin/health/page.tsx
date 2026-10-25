import { getSystemHealth } from "@/server/services/health-service";
import { formatDateTimeBr } from "@/lib/format-date";

const when = (iso: string) => formatDateTimeBr(iso);

export default async function HealthPage() {
  const health = await getSystemHealth();
  const checks = [
    { ok: health.aiProvider !== null, label: "Inteligencia artificial ativa", fix: "Cadastre e ative uma chave em Configuracoes > IA." },
    { ok: health.hasGoogleKey, label: "Chave do Google (duracao das aulas)", fix: "Cadastre em Configuracoes." },
    { ok: health.hasGeminiKey, label: "Chave do Gemini (transcricao de YouTube/Drive)", fix: "Cadastre em Configuracoes > Transcricao." },
    { ok: health.hasEncryptionKey, label: "SETTINGS_ENCRYPTION_KEY definida", fix: "Sem ela, as chaves usam a service role do Supabase como segredo; defina na Vercel." },
    { ok: health.hasCronSecret, label: "CRON_SECRET definida (lembretes de estudo)", fix: "Defina na Vercel para ativar o cron diario." },
  ];

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal">Saude do sistema</h2>
        <p className="text-sm text-muted-foreground">Configuracao, lacunas de conteudo, custo de IA e ultimas acoes do painel.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Aulas ativas" value={health.lessons} />
        <Stat label="Sem duracao" value={health.noDuration} />
        <Stat label="Sem transcricao" value={health.noTranscript} />
        <Stat label="Duvidas sem resposta" value={health.pendingQuestions} />
      </div>

      <div className="rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Configuracao</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {checks.map((check) => (
            <li key={check.label}>
              <span className={check.ok ? "text-green-600" : "text-destructive"}>{check.ok ? "OK" : "Pendente"}</span> - {check.label}
              {check.ok ? null : <span className="block text-xs text-muted-foreground">{check.fix}</span>}
            </li>
          ))}
          <li>
            <span className="font-medium">{health.registrationOpen ? "Aberto" : "Fechado"}</span> - cadastro publico de alunos (Configuracoes)
          </li>
        </ul>
      </div>

      <div className="rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Custo de IA por curso (30 dias)</h3>
        {health.aiCost.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum uso de IA no periodo.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="mt-3 min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3">Curso</th>
                <th className="py-2 pr-3">Chamadas</th>
                <th className="py-2">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {health.aiCost.map((row) => (
                <tr className="border-b" key={row.course}>
                  <td className="py-2 pr-3">{row.course}</td>
                  <td className="py-2 pr-3">{row.calls}</td>
                  <td className="py-2">{row.tokens.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-background p-4">
        <h3 className="text-base font-semibold">Ultimas acoes do painel</h3>
        {health.audit.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma acao registrada ainda.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {health.audit.map((log) => (
              <li key={log.id}>
                <span className="text-muted-foreground">{when(log.when)}</span> - {log.who}: <code>{log.action}</code> ({log.entity}
                {log.entityId ? ` ${log.entityId.slice(0, 8)}` : ""})
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
