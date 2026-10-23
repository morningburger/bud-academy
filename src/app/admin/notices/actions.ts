"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

export type NoticeState = { error?: string } | null;

export async function saveNotice(_prev: NoticeState, form: FormData): Promise<NoticeState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "운영진만 쓸 수 있어요." };
  const id = String(form.get("id") ?? "") || null;
  const title = String(form.get("title") ?? "").trim().slice(0, 120);
  const body = String(form.get("body") ?? "").trim().slice(0, 20000);
  if (!title || !body) return { error: "제목과 내용을 입력해 주세요." };
  const fields = {
    title,
    body,
    is_pinned: form.get("is_pinned") === "on",
    is_published: form.get("is_published") === "on",
    updated_at: new Date().toISOString(),
  };
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("notices").update(fields).eq("id", id)
    : await supabase.from("notices").insert({ ...fields, created_by: viewer.userId });
  if (error) return { error: "저장하지 못했어요." };
  revalidatePath("/notices", "layout");
  revalidatePath("/admin/notices");
  redirect("/admin/notices");
}

export async function deleteNotice(form: FormData) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;
  const supabase = await createClient();
  await supabase.from("notices").delete().eq("id", String(form.get("id") ?? ""));
  revalidatePath("/notices", "layout");
  revalidatePath("/admin/notices");
  redirect("/admin/notices");
}
