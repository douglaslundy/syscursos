import { Prisma } from "@prisma/client";

export const BACKUP_FORMAT = "syscursos-backup-v1";
// Segredos salvos na UI nunca entram no backup.
const EXCLUDED_MODELS = new Set(["AppSetting"]);

// Modelos em ordem de dependencia (pais antes dos filhos), para o restore inserir sem violar FKs.
export function orderedModels() {
  const models = Prisma.dmmf.datamodel.models.filter((model) => !EXCLUDED_MODELS.has(model.name));
  const byName = new Map(models.map((model) => [model.name, model]));
  const ordered: string[] = [];
  const visit = (name: string) => {
    if (ordered.includes(name)) return;
    const model = byName.get(name);
    if (!model) return;
    for (const field of model.fields) {
      if (field.kind === "object" && (field.relationFromFields?.length ?? 0) > 0 && field.type !== name) {
        visit(field.type);
      }
    }
    ordered.push(name);
  };
  models.forEach((model) => visit(model.name));
  return ordered;
}
