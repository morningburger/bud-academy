"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CancelState = { error?: string; ok?: string } | null;

export async function requestCancel(_prev: CancelState, form: FormData): Promise<CancelState> {
  const id = String(form.get("id") ?? "");
  const reason = String(form.get("reason") ?? "").trim().slice(0, 300) || null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .update({ cancel_requested_at: new Date().toISOString(), cancel_reason: reason })
    .eq("id", id)
    .select("course_id")
    .maybeSingle();
  if (error) {
    if (error.message.includes("취소 가능 기간")) return { error: "취소 가능 기간이 지났어요. 양도가 필요하면 기획본부팀에 문의해 주세요." };
    return { error: "취소 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  revalidatePath("/me");
  if (data?.course_id) revalidatePath(`/courses/${data.course_id}`);
  return { ok: "취소 요청을 보냈어요. 운영진이 확인하면 취소돼요." };
}

export async function withdrawCancel(form: FormData) {
  const id = String(form.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("enrollments").update({ cancel_requested_at: null }).eq("id", id);
  revalidatePath("/me");
}
