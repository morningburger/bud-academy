import type { SupabaseClient } from "@supabase/supabase-js";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** 본인 폴더(media/<uid>/...)에 이미지를 올리고 공개 URL을 돌려준다. 파일이 없으면 null */
export async function uploadImage(supabase: SupabaseClient, userId: string, file: FormDataEntryValue | null, kind: string) {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = TYPES[file.type];
  if (!ext) throw new Error("JPG, PNG, WEBP 이미지만 올릴 수 있어요.");
  if (file.size > 4 * 1024 * 1024) throw new Error("이미지는 4MB 이하로 올려 주세요.");
  const path = `${userId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("이미지를 올리지 못했어요.");
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
