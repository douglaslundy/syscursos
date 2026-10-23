"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  MAX_BLOCK_DAYS,
  MIN_BLOCK_DAYS,
  removeBlockedRange,
  removeStudySchedule,
  rescheduleStudySchedule,
  saveStudyPreferences,
  saveStudySchedule,
  setCourseScheduleMode,
  type CourseModes,
} from "@/server/services/study-plan-service";
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

  const modes: CourseModes = Object.fromEntries(
    parsed.data.courseIds.map((id) => [id, formData.get(`mode_${id}`) === "modules" ? "modules" : "sequential"]),
  );
  const error = await saveStudySchedule({ ...parsed.data, modes });
  revalidatePath("/app/schedule");
  redirect(error ? `/app/schedule?status=${error}&edit=1` : "/app/schedule?status=saved");
}

export async function setCourseModeAction(formData: FormData) {
  const courseId = z.string().uuid().safeParse(formData.get("courseId"));

  if (!courseId.success) {
    redirect("/app/schedule?status=invalid");
  }

  const error = await setCourseScheduleMode(courseId.data, formData.get("mode") === "modules" ? "modules" : "sequential");
  revalidatePath("/app/schedule");
  redirect(error ? `/app/schedule?status=${error}&edit=1` : "/app/schedule?status=saved");
}

const rescheduleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("catchup") }),
  z.object({
    kind: z.literal("block"),
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    days: z.coerce.number().int().min(MIN_BLOCK_DAYS).max(MAX_BLOCK_DAYS),
  }),
]);

export async function rescheduleStudyPlanAction(formData: FormData) {
  const parsed = rescheduleSchema.safeParse({
    kind: formData.get("kind"),
    start: formData.get("start"),
    days: formData.get("days"),
  });

  if (!parsed.success) {
    redirect("/app/schedule?status=invalid_block&reschedule=1");
  }

  const error = await rescheduleStudySchedule(parsed.data);
  revalidatePath("/app/schedule");
  redirect(error ? `/app/schedule?status=${error}&reschedule=1` : "/app/schedule?status=rescheduled");
}

export async function removeBlockedRangeAction(formData: FormData) {
  const start = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).safeParse(formData.get("start"));
  const error = start.success ? await removeBlockedRange(start.data) : "invalid_block";
  revalidatePath("/app/schedule");
  redirect(error ? `/app/schedule?status=${error}` : "/app/schedule?status=rescheduled");
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
