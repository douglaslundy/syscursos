"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { addToPlaylist, createPlaylist, deletePlaylist, moveInPlaylist, removeFromPlaylist } from "@/server/services/playlist-service";

const uuid = z.string().uuid();

export async function createPlaylistAction(formData: FormData) {
  const result = await createPlaylist(String(formData.get("name") ?? ""));

  redirect(result.ok ? `/app/playlists/${result.id}` : `/app/playlists?status=${result.error}`);
}

export async function deletePlaylistAction(formData: FormData) {
  const id = uuid.safeParse(formData.get("id"));

  if (id.success) await deletePlaylist(id.data);

  revalidatePath("/app/playlists");
  redirect("/app/playlists");
}

const addSchema = z.object({ playlistId: uuid, courseId: uuid, lessonId: uuid });

export async function addToPlaylistAction(input: z.infer<typeof addSchema>) {
  const parsed = addSchema.safeParse(input);

  if (!parsed.success) return "forbidden" as const;

  const result = await addToPlaylist(parsed.data);

  if (result === "ok") revalidatePath(`/app/playlists/${parsed.data.playlistId}`);

  return result;
}

export async function removeFromPlaylistAction(formData: FormData) {
  const itemId = uuid.safeParse(formData.get("itemId"));
  const playlistId = uuid.safeParse(formData.get("playlistId"));

  if (itemId.success) await removeFromPlaylist(itemId.data);
  if (playlistId.success) revalidatePath(`/app/playlists/${playlistId.data}`);
}

export async function moveInPlaylistAction(formData: FormData) {
  const itemId = uuid.safeParse(formData.get("itemId"));
  const playlistId = uuid.safeParse(formData.get("playlistId"));
  const direction = formData.get("direction") === "up" ? "up" : "down";

  if (itemId.success) await moveInPlaylist(itemId.data, direction);
  if (playlistId.success) revalidatePath(`/app/playlists/${playlistId.data}`);
}
