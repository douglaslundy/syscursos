"use server";

import { redirect } from "next/navigation";

import { recordAudit } from "@/server/services/audit-service";
import { saveFeatureEnabled } from "@/server/services/feature-service";

const PATH = "/admin/settings/features";

export async function saveFeatureAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const enabled = formData.get("enabled") === "true";

  if (!(await saveFeatureEnabled(id, enabled))) redirect(`${PATH}?status=invalid`);

  await recordAudit("settings.feature_toggle", "setting", id, { enabled });
  redirect(`${PATH}?status=saved`);
}
