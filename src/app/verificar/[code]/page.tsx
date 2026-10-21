import type { Metadata } from "next";

import { verifyCertificate } from "@/server/services/certificate-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Verificar certificado", robots: { index: false } };

// Pagina publica: confirma se um codigo de certificado existe. Mostra so nome, curso e data.
export default async function VerifyCertificatePage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;
  const certificate = await verifyCertificate(decodeURIComponent(code).toUpperCase());

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold">Verificacao de certificado</h1>
      {certificate ? (
        <div className="rounded-md border p-5" role="status">
          <p className="text-sm font-semibold text-green-600">Certificado valido</p>
          <p className="mt-3 text-lg font-semibold">{certificate.studentName}</p>
          <p className="text-sm">concluiu o curso</p>
          <p className="text-lg font-semibold">{certificate.courseTitle}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Emitido em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(certificate.issuedAt))}
          </p>
        </div>
      ) : (
        <p className="rounded-md border p-5 text-sm text-destructive" role="status">
          Nenhum certificado encontrado com este codigo. Confira se ele foi digitado corretamente.
        </p>
      )}
    </main>
  );
}
