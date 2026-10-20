"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { removeStudySchedule, saveStudyPreferences, saveStudySchedule } from "@/server/services/study-plan-service";
import { studyPlanSchema, studyPreferencesSchema } from "@/server/validators/student";

export async function saveStudyPlanAction(formData: FormData) {
  const parsed = studyPlanSchema.safeParse({
    courseIds: formData.getAll("courseIds"),
    targetDate: formData.get("targetDate"),
    minutesPerDay: formData.get("minutesPerDay"),
  });

  if (!parsed.success) {
    redirect("/app/schedule?status=invalid&edit=1");
  }

  const error = await saveStudySchedule(parsed.data);
  revalidatePath("/app/schedule");
  redirect(error ? `/app/schedule?status=${error}&edit=1` : "/app/schedule?status=saved");
}

export async function removeStudyPlanAction() {
  await removeStudySchedule();
  revalidatePath("/app/schedule");
  redirect("/app/schedule?status=removed");
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
