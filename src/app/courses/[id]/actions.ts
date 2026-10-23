"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

export type ApplyState = { ok: boolean; message: string } | null;

export async function applyToCourse(_prev: ApplyState, form: FormData): Promise<ApplyState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "로그인 후 신청할 수 있어요." };

  const courseId = String(form.get("course_id") ?? "");
  const sessionId = String(form.get("session_id") ?? "") || null;
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").replace(/[^0-9]/g, "");
  const message = String(form.get("message") ?? "").trim() || null;

  if (!name) return { ok: false, message: "이름을 입력해 주세요." };
  if (phone.length < 10) return { ok: false, message: "연락받을 휴대폰 번호를 정확히 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({
    course_id: courseId,
    session_id: sessionId,
    user_id: viewer.userId,
    applicant_name: name,
    applicant_phone: phone,
    message,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "이미 신청한 회차예요. 내 강의실에서 확인할 수 있어요." };
    return { ok: false, message: "신청을 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  if (!viewer.phone) {
    await supabase.from("profiles").update({ phone }).eq("id", viewer.userId);
  }
  revalidatePath(`/courses/${courseId}`);
  return { ok: true, message: "신청이 접수됐어요. 담당자가 확인 후 입금 안내와 함께 연락드려요." };
}
