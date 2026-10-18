"use server";

import { redirect } from "next/navigation";

import {
  removeGeminiApiKey,
  removeGoogleApiKey,
  saveGeminiApiKey,
  saveGoogleApiKey,
  saveTranscriptionMethod,
  testGeminiApiKey,
  testGoogleApiKey,
} from "@/server/services/settings-service";

const PATH = "/admin/settings";

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
  redirect(`${PATH}?status=gkey_saved`);
}

export async function testGoogleKeyAction(formData: FormData) {
  const result = await testGoogleApiKey(readKey(formData) || null);
  redirect(`${PATH}?status=gkey_test_${result}`);
}

export async function removeGoogleKeyAction() {
  await removeGoogleApiKey();
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
  redirect(`${TRANSCRIPTION_PATH}?status=gemini_saved`);
}

export async function testGeminiKeyAction(formData: FormData) {
  const result = await testGeminiApiKey(readKey(formData) || null);
  redirect(`${TRANSCRIPTION_PATH}?status=gemini_test_${result}`);
}

export async function removeGeminiKeyAction() {
  await removeGeminiApiKey();
  redirect(`${TRANSCRIPTION_PATH}?status=gemini_removed`);
}
