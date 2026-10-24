"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createWhatsappCodeAction, unlinkWhatsappAction } from "@/server/actions/whatsapp-actions";

type WhatsappLinkPanelProps = { linked: boolean; masked: string | null };

const buttonClass = "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60";

export function WhatsappLinkPanel({ linked, masked }: WhatsappLinkPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const generate = () =>
    startTransition(async () => {
      try {
        setFailed(false);
        setCode((await createWhatsappCodeAction()).code);
      } catch {
        setFailed(true);
      }
    });
  const unlink = () =>
    startTransition(async () => {
      try {
        setFailed(false);
        await unlinkWhatsappAction();
        setCode(null);
        router.refresh();
      } catch {
        setFailed(true);
      }
    });

  return (
    <div className="mt-6 grid max-w-2xl gap-3 rounded-md border bg-background p-4">
      <h2 className="text-base font-semibold">Estudar pelo WhatsApp</h2>
      {linked ? (
        <>
          <p className="text-sm text-muted-foreground">WhatsApp vinculado: {masked}. O agente responde apenas a este numero.</p>
          <button className={buttonClass} disabled={pending} onClick={unlink} type="button">
            Desvincular
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Gere um codigo e envie ao agente do WhatsApp na mensagem &quot;vincular CODIGO&quot;. O codigo vale por 10 minutos e so funciona uma vez.
          </p>
          {code ? (
            <p className="rounded-md border px-3 py-2 text-center font-mono text-2xl tracking-widest" data-testid="whatsapp-code">
              {code}
            </p>
          ) : null}
          <button className={buttonClass} disabled={pending} onClick={generate} type="button">
            {code ? "Gerar novo codigo" : "Gerar codigo"}
          </button>
        </>
      )}
      {failed ? <p className="text-sm text-danger">Nao foi possivel concluir. Tente novamente.</p> : null}
    </div>
  );
}
