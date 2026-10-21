import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export function assertValidCourseCover(file: File, errorPath: string) {
  assertValidImageCover(file, errorPath);
}

export function assertValidImageCover(file: File, errorPath: string) {
  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ]);
  // Precisa bater com o file_size_limit real configurado no bucket do Supabase
  // Storage (5MB = 5.000.000 bytes, unidade decimal usada pelo Supabase), senao
  // um arquivo aprovado aqui pode ser rejeitado la com erro generico de storage.
  const maxBytes = 5_000_000;

  if (!allowedTypes.has(file.type) || file.size > maxBytes) {
    redirect(`${errorPath}?status=invalid`);
  }
}

export async function uploadCourseCover(file: File) {
  return uploadImageCover(file, "courses");
}

export async function uploadImageCover(file: File, folder: "courses" | "lessons") {
  const supabase = createSupabaseAdminClient();
  const bucket = process.env.SUPABASE_COURSE_COVER_BUCKET ?? "course-covers";
  await ensureCourseCoverBucket(supabase, bucket);
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const sanitizedExtension = extension.replace(/[^a-z0-9]/g, "") || "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${sanitizedExtension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const upload = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });

  if (upload.error) {
    const reason = upload.error.message.toLowerCase();

    if (reason.includes("exceeded the maximum allowed size") || reason.includes("payload too large")) {
      throw new Error(`Capa maior que o limite permitido pelo storage: ${upload.error.message}`);
    }

    if (reason.includes("mime type") || reason.includes("not supported")) {
      throw new Error(`Formato de imagem nao suportado pelo storage: ${upload.error.message}`);
    }

    throw new Error(`Erro ao enviar capa para storage: ${upload.error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function ensureCourseCoverBucket(supabase: SupabaseClient, bucket: string) {
  const current = await supabase.storage.getBucket(bucket);

  if (!current.error && current.data) {
    return;
  }

  if (current.error && !current.error.message.toLowerCase().includes("not found")) {
    throw new Error(`Erro ao consultar bucket de capas: ${current.error.message}`);
  }

  const created = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  });

  if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
    throw new Error(`Erro ao criar bucket de capas: ${created.error.message}`);
  }
}
