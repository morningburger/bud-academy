"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { readSheet, toLegacyApplicants } from "@/lib/legacy-import";

export type ImportState = { error?: string; ok?: string } | null;

export async function importLegacyEnrollments(_prev: ImportState, form: FormData): Promise<ImportState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "운영진만 할 수 있어요." };
  const sessionId = String(form.get("session_id") ?? "");
  const file = form.get("file");
  if (!sessionId) return { error: "옮길 회차를 골라 주세요." };
  if (!(file instanceof File) || file.size === 0) return { error: "파일을 골라 주세요." };
  if (file.size > 4 * 1024 * 1024 || !/\.(xlsx|csv)$/i.test(file.name)) return { error: "4MB 이하 엑셀(.xlsx) 또는 CSV 파일만 올릴 수 있어요." };

  const supabase = await createClient();
  const { data: session } = await supabase.from("course_sessions").select("id, course_id, label").eq("id", sessionId).maybeSingle();
  if (!session) return { error: "회차를 찾지 못했어요." };

  let parsed;
  try {
    parsed = toLegacyApplicants(await readSheet(file));
  } catch {
    return { error: "파일을 읽지 못했어요. 수강생 목록 엑셀이 맞는지 확인해 주세요." };
  }
  if (parsed.rows.length === 0) return { error: "이메일이나 휴대폰 번호가 있는 행을 찾지 못했어요." };

  const { data: existing } = await supabase.from("legacy_enrollments").select("email, phone").eq("session_id", sessionId);
  const seen = new Set((existing ?? []).map((e) => e.email ?? `tel:${e.phone}`));
  const fresh = parsed.rows.filter((r) => !seen.has(r.email ?? `tel:${r.phone}`));
  if (fresh.length) {
    const { error } = await supabase.from("legacy_enrollments").insert(
      fresh.map((r) => ({ ...r, session_id: session.id, course_id: session.course_id })),
    );
    if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  await supabase.rpc("link_legacy_members");
  revalidatePath("/admin", "layout");
  revalidatePath("/manage", "layout");
  return {
    ok: `${session.label}: ${fresh.length}명을 옮겼어요${parsed.rows.length - fresh.length ? ` (이미 있던 ${parsed.rows.length - fresh.length}명 제외)` : ""}${parsed.skipped ? `, 연락처 없는 행 ${parsed.skipped}개 건너뜀` : ""}. 이미 가입한 회원은 바로 수강 확정으로 연결했어요.`,
  };
}
