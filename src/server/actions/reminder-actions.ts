"use server";

import { redirect } from "next/navigation";

import type { ReminderConfig } from "@/lib/study/reminder-slots";
import { saveReminderConfig } from "@/server/services/reminder-config-service";

const PATH = "/app/reminders";
const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

export async function saveReminderAction(formData: FormData) {
  const mode = text(formData, "mode");
  const count = Number(text(formData, "count"));
  const config: ReminderConfig = {
    mode: mode === "times" || mode === "interval" ? mode : "off",
    count: Number.isFinite(count) ? count : 0,
    times: [text(formData, "time1"), text(formData, "time2"), text(formData, "time3")],
    start: text(formData, "start"),
    intervalMin: Number(text(formData, "intervalMin")),
  };
  const result = await saveReminderConfig(config);

  redirect(`${PATH}?status=${result === "saved" ? "saved" : "invalid"}`);
}
