"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import type { AttendanceStatus } from "@/lib/attendance";

export type ActionState = { error?: string; ok?: string } | null;

const STATUSES: AttendanceStatus[] = ["present", "late", "absent", "excused"];
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/** 수업일 추가 (이미 있으면 그 날로 이동) */
export async function addClassDay(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await getViewer())) return { error: "로그인이 필요해요." };
  const sessionId = str(form, "session_id");
  const date = str(form, "class_date");
  if (!isDate(date)) return { error: "수업 날짜를 골라 주세요." };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("class_days").select("id").eq("session_id", sessionId).eq("class_date", date).maybeSingle();
  let dayId = existing?.id as string | undefined;
  if (!dayId) {
    const { data, error } = await supabase
      .from("class_days")
      .insert({ session_id: sessionId, class_date: date, title: str(form, "title") || null })
      .select("id")
      .single();
    if (error) return { error: "수업일을 추가하지 못했어요. 이 회차의 강사진인지 확인해 주세요." };
    dayId = data.id;
  }
  revalidatePath(`/attendance/${sessionId}`);
  redirect(`/attendance/${sessionId}?day=${dayId}`);
}

export async function deleteClassDay(form: FormData) {
  const supabase = await createClient();
  const sessionId = str(form, "session_id");
  await supabase.from("class_days").delete().eq("id", str(form, "id"));
  revalidatePath(`/attendance/${sessionId}`);
  redirect(`/attendance/${sessionId}`);
}

/** 한 명 또는 여러 명의 출결 저장. status 가 비어 있으면 체크 해제 */
export async function markAttendance(input: {
  sessionId: string;
  classDayId: string;
  enrollmentIds: string[];
  status: AttendanceStatus | null;
}): Promise<ActionState> {
  if (!(await getViewer())) return { error: "로그인이 필요해요." };
  if (!input.enrollmentIds.length) return null;
  const supabase = await createClient();

  if (input.status === null) {
    const { error } = await supabase
      .from("attendance").delete()
      .eq("class_day_id", input.classDayId)
      .in("enrollment_id", input.enrollmentIds);
    if (error) return { error: "저장하지 못했어요." };
  } else {
    if (!STATUSES.includes(input.status)) return { error: "알 수 없는 출결이에요." };
    const rows = input.enrollmentIds.map((enrollment_id) => ({
      class_day_id: input.classDayId,
      enrollment_id,
      status: input.status,
    }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "class_day_id,enrollment_id" });
    if (error) return { error: error.message.includes("수강생") ? error.message : "저장하지 못했어요. 새로고침 후 다시 해 주세요." };
  }
  revalidatePath(`/attendance/${input.sessionId}`);
  return { ok: "저장했어요." };
}

export async function saveAttendanceNote(input: { sessionId: string; classDayId: string; enrollmentId: string; note: string }): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("attendance")
    .update({ note: input.note.trim() || null })
    .eq("class_day_id", input.classDayId)
    .eq("enrollment_id", input.enrollmentId);
  if (error) return { error: "메모를 저장하지 못했어요." };
  revalidatePath(`/attendance/${input.sessionId}`);
  return { ok: "저장했어요." };
}
