"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { profileFormError, readProfileForm } from "@/lib/profile-form";

export type ProfileState = { error?: string; ok?: string } | null;

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "";
}

export async function saveProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "로그인이 필요해요." };
  const profile = readProfileForm(form);
  const err = profileFormError(profile);
  if (err) return { error: err };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ...profile, marketing_agreed: form.get("marketing") === "on" })
    .eq("id", viewer.userId);
  if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  revalidatePath("/", "layout");
  const next = safeNext(form.get("next"));
  if (next) redirect(next);
  return { ok: "저장했어요." };
}
