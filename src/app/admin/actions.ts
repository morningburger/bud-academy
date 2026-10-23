"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { uploadImage } from "@/lib/upload";

export type AdminState = { error?: string; ok?: string } | null;

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const strOrNull = (f: FormData, k: string) => str(f, k) || null;

async function adminOnly() {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) throw new Error("관리자만 할 수 있어요.");
  return viewer;
}

export async function addStaffByEmail(_prev: AdminState, form: FormData): Promise<AdminState> {
  try { await adminOnly(); } catch (e) { return { error: (e as Error).message }; }
  const email = str(form, "email").toLowerCase();
  if (!email.includes("@")) return { error: "이메일을 정확히 입력해 주세요." };
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, name").ilike("email", email).maybeSingle();
  if (!profile) return { error: "이 이메일로 가입한 회원이 없어요. 먼저 사이트에서 회원가입을 해 달라고 안내해 주세요." };
  const { error } = await supabase.from("admins").insert({ user_id: profile.id });
  if (error) {
    if (error.code === "23505") return { error: "이미 운영진이에요." };
    return { error: "권한을 주지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  revalidatePath("/admin/staff");
  return { ok: `${profile.name ?? email}님에게 관리자 권한을 드렸어요.` };
}

export async function removeStaff(form: FormData) {
  const viewer = await adminOnly();
  const userId = str(form, "user_id");
  if (userId === viewer.userId) return;
  const supabase = await createClient();
  await supabase.from("admins").delete().eq("user_id", userId);
  revalidatePath("/admin/staff");
}

export async function saveInstructorByAdmin(_prev: AdminState, form: FormData): Promise<AdminState> {
  let viewer;
  try { viewer = await adminOnly(); } catch (e) { return { error: (e as Error).message }; }
  const id = str(form, "id");
  const name = str(form, "name");
  if (!name) return { error: "이름을 입력해 주세요." };
  const supabase = await createClient();
  let photo_url: string | null = null;
  try {
    photo_url = await uploadImage(supabase, viewer.userId, form.get("photo"), "instructor");
  } catch (e) {
    return { error: (e as Error).message };
  }
  const { error } = await supabase
    .from("instructors")
    .update({
      name,
      headline: strOrNull(form, "headline"),
      bio: strOrNull(form, "bio"),
      career: strOrNull(form, "career"),
      instagram: strOrNull(form, "instagram")?.replace(/^@/, "") ?? null,
      branch_name: strOrNull(form, "branch_name"),
      ...(form.get("remove_photo") === "on" ? { photo_url: null } : photo_url ? { photo_url } : {}),
    })
    .eq("id", id);
  if (error) return { error: "저장하지 못했어요." };
  revalidatePath("/", "layout");
  return { ok: "저장했어요." };
}
