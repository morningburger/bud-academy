"use server";

import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string; ok?: string } | null;

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "비밀번호는 8자 이상으로 정해 주세요." };
  if (password !== confirm) return { error: "두 비밀번호가 서로 달라요." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "지금 쓰는 비밀번호와 다르게 정해 주세요." };
    if (error.code === "weak_password") return { error: "더 안전한 비밀번호를 정해 주세요." };
    return { error: "바꾸지 못했어요. 링크가 만료됐다면 비밀번호 찾기를 다시 해 주세요." };
  }
  return { ok: "비밀번호를 바꿨어요." };
}
