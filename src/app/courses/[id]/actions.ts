"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";

export type ApplyState = { ok: boolean; message: string } | null;

const RULE_MESSAGES: [string, string][] = [
  ["회원 정보", "회원 정보(소속·직급)를 먼저 입력해 주세요."],
  ["소속만", "고정현헤어 소속만 신청할 수 있는 강좌예요."],
  ["회차를 선택", "회차를 골라 주세요."],
  ["마감된 회차", "모집이 마감된 회차예요."],
  ["신청 기간", "신청 기간이 지난 회차예요."],
  ["정원", "정원이 모두 찼어요. 다른 회차를 골라 주세요."],
  ["신청을 받지 않는", "지금은 신청을 받지 않는 강좌예요."],
];

export async function applyToCourse(_prev: ApplyState, form: FormData): Promise<ApplyState> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, message: "로그인 후 신청할 수 있어요." };
  if (!viewer.profileComplete) return { ok: false, message: "회원 정보(소속·직급)를 먼저 입력해 주세요." };

  const courseId = String(form.get("course_id") ?? "");
  const sessionId = String(form.get("session_id") ?? "") || null;
  const message = String(form.get("message") ?? "").trim().slice(0, 500) || null;
  if (form.get("agree_policy") !== "on") return { ok: false, message: "취소·환불 규정을 확인하고 체크해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({
    course_id: courseId,
    session_id: sessionId,
    user_id: viewer.userId,
    applicant_name: viewer.name!,
    applicant_phone: viewer.phone!,
    message,
  });

  if (error) {
    if (error.code === "23505") return { ok: false, message: "이미 신청한 회차예요. 내 강의실에서 확인할 수 있어요." };
    const rule = RULE_MESSAGES.find(([k]) => error.message.includes(k));
    if (rule) return { ok: false, message: rule[1] };
    return { ok: false, message: "신청을 저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/me");
  return { ok: true, message: "수강이 확정됐어요. 일정에 맞춰 와 주세요." };
}
