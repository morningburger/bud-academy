"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { profileFormError, readProfileForm } from "@/lib/profile-form";

export type AuthState = { error?: string; info?: string } | null;

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "/";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "이메일 인증을 아직 완료하지 않았어요. 받은 메일의 링크를 눌러주세요." };
    return { error: "이메일 또는 비밀번호가 맞지 않아요." };
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const profile = readProfileForm(form);
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const profileError = profileFormError(profile);
  if (profileError) return { error: profileError };
  if (password.length < 8) return { error: "비밀번호는 8자 이상으로 정해 주세요." };
  if (form.get("agree") !== "on") return { error: "이용약관과 개인정보 수집·이용에 동의해 주세요." };

  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const next = safeNext(form.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { ...profile, marketing_agreed: form.get("marketing") === "on" ? "true" : "false" },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "이미 가입된 이메일이에요. 로그인해 주세요." };
    if (error.code === "weak_password") return { error: "더 안전한 비밀번호를 정해 주세요." };
    return { error: "가입하지 못했어요. 입력한 내용을 확인해 주세요." };
  }
  if (data.session) redirect(next);
  return { info: `${email}로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요.` };
}

export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "이메일을 정확히 입력해 주세요." };
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/me/password")}`,
  });
  if (error?.status === 429) return { error: "잠시 후 다시 시도해 주세요. 메일은 몇 분에 한 번만 보낼 수 있어요." };
  // 가입 여부는 알려주지 않는다
  return { info: `${email}로 가입되어 있다면 비밀번호를 다시 정하는 메일을 보냈어요. 메일의 링크는 1시간 동안 쓸 수 있어요.` };
}
