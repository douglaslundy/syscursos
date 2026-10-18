"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { saveStudyPlan, saveStudyPreferences } from "@/server/services/study-plan-service";
import { studyPlanSchema, studyPreferencesSchema } from "@/server/validators/student";

export async function saveStudyPlanAction(formData: FormData) {
  const parsed = studyPlanSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const courseId = formData.get("courseId");
    redirect(typeof courseId === "string" ? `/app/courses/${courseId}/plan?status=invalid` : "/app");
  }

  const { courseId, ...input } = parsed.data;
  const error = await saveStudyPlan(courseId, input);
  revalidatePath(`/app/courses/${courseId}/plan`);
  redirect(`/app/courses/${courseId}/plan?status=${error ?? "saved"}`);
}

export async function saveStudyPreferencesAction(formData: FormData) {
  const parsed = studyPreferencesSchema.safeParse({
    weekdays: formData.getAll("weekdays"),
    start: formData.get("start"),
    end: formData.get("end"),
  });

  if (!parsed.success) {
    redirect("/app/me?status=study_prefs_invalid");
  }

  await saveStudyPreferences(parsed.data);
  revalidatePath("/app/me");
  redirect("/app/me?status=study_prefs_saved");
}
