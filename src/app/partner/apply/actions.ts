"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";

export type FormState = { error?: string } | null;

export async function saveInstructorProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "로그인이 필요해요." };
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "활동명을 입력해 주세요." };

  const supabase = await createClient();
  let photo_url: string | null | undefined;
  try {
    photo_url = await uploadImage(supabase, viewer.userId, form.get("photo"), "profile");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const fields = {
    name,
    headline: String(form.get("headline") ?? "").trim() || null,
    bio: String(form.get("bio") ?? "").trim() || null,
    career: String(form.get("career") ?? "").trim() || null,
    instagram: String(form.get("instagram") ?? "").trim().replace(/^@/, "") || null,
    branch_name: String(form.get("branch_name") ?? "").trim() || null,
    ...(photo_url ? { photo_url } : {}),
  };

  const { error } = viewer.instructor
    ? await supabase.from("instructors").update(fields).eq("id", viewer.instructor.id)
    : await supabase.from("instructors").insert({ ...fields, user_id: viewer.userId });
  if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

  revalidatePath("/", "layout");
  redirect(viewer.instructor?.status === "approved" ? "/studio" : "/partner");
}
