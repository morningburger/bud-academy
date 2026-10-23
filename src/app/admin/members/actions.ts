"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { listBranches } from "@/lib/queries";
import { readSheet, toLegacyRows } from "@/lib/legacy-import";

export type ImportState = { error?: string; ok?: string } | null;

export async function importLegacyMembers(_prev: ImportState, form: FormData): Promise<ImportState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "운영진만 할 수 있어요." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "파일을 골라 주세요." };
  if (file.size > 4 * 1024 * 1024) return { error: "4MB 이하 파일만 올릴 수 있어요." };
  if (!/\.(xlsx|csv)$/i.test(file.name)) return { error: "엑셀(.xlsx) 또는 CSV 파일만 올릴 수 있어요." };

  let parsed;
  try {
    parsed = toLegacyRows(await readSheet(file), await listBranches());
  } catch (e) {
    return { error: (e as Error).message.includes("이메일") ? (e as Error).message : "파일을 읽지 못했어요. 회원 목록 엑셀이 맞는지 확인해 주세요." };
  }
  if (parsed.rows.length === 0) return { error: "이메일이 있는 회원 행을 찾지 못했어요." };

  const supabase = await createClient();
  for (let i = 0; i < parsed.rows.length; i += 500) {
    const { error } = await supabase
      .from("legacy_members")
      .upsert(parsed.rows.slice(i, i + 500).map((r) => ({ ...r, imported_at: new Date().toISOString() })), { onConflict: "email" });
    if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  const { data: linked } = await supabase.rpc("link_legacy_members");
  const matched = parsed.rows.filter((r) => r.org_type === "gohair").length;
  revalidatePath("/admin/members", "layout");
  return {
    ok: `${parsed.rows.length.toLocaleString("ko-KR")}명을 가져왔어요. 지점 자동 인식 ${matched}명${parsed.skipped ? `, 이메일 없는 행 ${parsed.skipped}개 건너뜀` : ""}${linked ? `, 이미 가입한 ${linked}명 연결` : ""}.`,
  };
}

export async function addBranch(form: FormData) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  if (!name) return;
  const supabase = await createClient();
  await supabase.from("branches").upsert({ name, active: true, sort_order: 500 }, { onConflict: "name" });
  revalidatePath("/", "layout");
}

export async function toggleBranch(form: FormData) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return;
  const supabase = await createClient();
  await supabase.from("branches").update({ active: form.get("active") === "true" }).eq("name", String(form.get("name") ?? ""));
  revalidatePath("/", "layout");
}
