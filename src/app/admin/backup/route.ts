import { recordAudit } from "@/server/services/audit-service";
import { createBackup } from "@/server/services/backup-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const file = await createBackup();
  await recordAudit("backup.download", "backup");
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");

  return new Response(new Uint8Array(file), {
    headers: {
      "content-type": "application/gzip",
      "content-disposition": `attachment; filename="syscursos-backup-${stamp}.json.gz"`,
      "cache-control": "no-store",
    },
  });
}
