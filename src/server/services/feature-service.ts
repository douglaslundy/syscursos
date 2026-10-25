import { notFound } from "next/navigation";

import { parseDisabled, featureIds, STUDENT_FEATURES } from "@/lib/features";
import { requireRole } from "@/server/auth/guards";
import { appSettings } from "@/server/services/app-settings";

const KEY = "features_disabled";

export async function getDisabledFeatures() {
  const row = await appSettings.findUnique({ where: { key: KEY } });

  return new Set(parseDisabled(row?.value));
}

export async function isFeatureEnabled(id: string) {
  return !(await getDisabledFeatures()).has(id);
}

// Para layouts das secoes do aluno: recurso desligado vira 404.
export async function requireFeature(id: string) {
  if (!(await isFeatureEnabled(id))) notFound();
}

export async function getHiddenStudentHrefs() {
  const disabled = await getDisabledFeatures();

  return STUDENT_FEATURES.filter((feature) => disabled.has(feature.id)).map((feature) => feature.href as string);
}

export async function saveFeatureEnabled(id: string, enabled: boolean) {
  await requireRole("ADMIN");
  if (!featureIds.has(id)) return false;

  const disabled = await getDisabledFeatures();

  if (enabled) disabled.delete(id);
  else disabled.add(id);

  const value = JSON.stringify([...disabled]);

  await appSettings.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
  return true;
}
