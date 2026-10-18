"use server";

import { redirect } from "next/navigation";

import {
  removeGoogleApiKey,
  saveGoogleApiKey,
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
