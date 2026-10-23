"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { SUGGESTION_CATEGORY } from "@/lib/format";

export type SuggestState = { error?: string; ok?: string } | null;

export async function submitSuggestion(_prev: SuggestState, form: FormData): Promise<SuggestState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "로그인이 필요해요." };
  const category = String(form.get("category") ?? "");
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  if (!(category in SUGGESTION_CATEGORY)) return { error: "종류를 골라 주세요." };
  if (body.length < 2) return { error: "내용을 적어 주세요." };
  const supabase = await createClient();
  const { error } = await supabase.from("suggestions").insert({ user_id: viewer.userId, category, body });
  if (error) return { error: "보내지 못했어요. 잠시 후 다시 시도해 주세요." };
  revalidatePath("/suggest");
  revalidatePath("/admin", "layout");
  return { ok: "건의를 보냈어요. 운영진이 확인할게요." };
}
