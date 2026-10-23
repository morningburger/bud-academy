"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthState } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, null);
  if (state?.info) {
    return (
      <div className="rounded-2xl bg-blue-weak p-6">
        <p className="font-bold text-blue mb-1">메일을 확인해 주세요</p>
        <p className="text-ink-2">{state.info}</p>
        <p className="mt-3 text-[13px] text-sub">메일이 안 보이면 스팸함도 확인해 주세요.</p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="email">가입한 이메일</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" />
      </div>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? "보내는 중" : "재설정 메일 받기"}</button>
      <p className="text-center text-[14px] text-sub">
        <Link href="/login" className="text-blue font-semibold">로그인으로 돌아가기</Link>
      </p>
    </form>
  );
}
