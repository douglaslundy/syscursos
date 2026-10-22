"use server";

import { redirect } from "next/navigation";

import {
  removeGeminiApiKey,
  removeGoogleApiKey,
  saveGeminiApiKey,
  saveGoogleApiKey,
  savePlayerMode,
  saveRegistrationOpen,
  saveTranscriptionMethod,
  testGeminiApiKey,
  testGoogleApiKey,
} from "@/server/services/settings-service";
import { recordAudit } from "@/server/services/audit-service";

const PATH = "/admin/settings";

export async function saveRegistrationOpenAction(formData: FormData) {
  await saveRegistrationOpen(formData.get("open") === "true");
  redirect(`${PATH}?status=saved`);
}

export async function savePlayerModeAction(formData: FormData) {
  const mode = formData.get("mode");

  if (mode !== "embed" && mode !== "own") {
    redirect(`${PATH}?status=invalid`);
  }

  const result = await savePlayerMode(mode);

  if (result === "saved") await recordAudit("settings.player_mode_save", "setting");
  redirect(`${PATH}?status=${result === "saved" ? "player_saved" : "player_need_key"}`);
}

function readKey(formData: FormData) {
  const value = formData.get("apiKey");
  return typeof value === "string" ? value.trim() : "";
}

export async function saveGoogleKeyAction(formData: FormData) {
  const key = readKey(formData);

  if (key.length < 20 || key.length > 200 || /\s/.test(key)) {
    redirect(`${PATH}?status=gkey_invalid_format`);
  }

  await saveGoogleApiKey(key);
  await recordAudit("settings.google_key_save", "setting");
  redirect(`${PATH}?status=gkey_saved`);
}

export async function testGoogleKeyAction(formData: FormData) {
  const result = await testGoogleApiKey(readKey(formData) || null);
  redirect(`${PATH}?status=gkey_test_${result}`);
}

export async function removeGoogleKeyAction() {
  await removeGoogleApiKey();
  await recordAudit("settings.google_key_remove", "setting");
  redirect(`${PATH}?status=gkey_removed`);
}

const TRANSCRIPTION_PATH = "/admin/settings/transcription";

function isValidKey(key: string) {
  return key.length >= 20 && key.length <= 200 && !/\s/.test(key);
}

export async function saveTranscriptionMethodAction(formData: FormData) {
  const method = formData.get("method");

  if (method !== "browser" && method !== "gemini") {
    redirect(`${TRANSCRIPTION_PATH}?status=invalid`);
  }

  const result = await saveTranscriptionMethod(method);
  redirect(`${TRANSCRIPTION_PATH}?status=${result === "saved" ? "transcription_saved" : "transcription_need_key"}`);
}

export async function saveGeminiKeyAction(formData: FormData) {
  const key = readKey(formData);

  if (!isValidKey(key)) {
    redirect(`${TRANSCRIPTION_PATH}?status=gemini_invalid_format`);
  }

  await saveGeminiApiKey(key);
  await recordAudit("settings.gemini_key_save", "setting");
  redirect(`${TRANSCRIPTION_PATH}?status=gemini_saved`);
}

export async function testGeminiKeyAction(formData: FormData) {
  const result = await testGeminiApiKey(readKey(formData) || null);
  redirect(`${TRANSCRIPTION_PATH}?status=gemini_test_${result}`);
}

export async function removeGeminiKeyAction() {
  await removeGeminiApiKey();
  await recordAudit("settings.gemini_key_remove", "setting");
  redirect(`${TRANSCRIPTION_PATH}?status=gemini_removed`);
}
