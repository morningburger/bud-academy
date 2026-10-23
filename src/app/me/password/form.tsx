"use client";

import { useActionState } from "react";
import Link from "next/link";
import { changePassword, type PasswordState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, null);
  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-blue-weak p-6">
        <p className="font-bold text-blue mb-1">{state.ok}</p>
        <Link href="/me" className="btn-primary w-full mt-3">내 강의실로 가기</Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="password">새 비밀번호 (8자 이상)</label>
        <input id="password" name="password" type="password" minLength={8} className="input" required autoComplete="new-password" />
      </div>
      <div>
        <label className="field-label" htmlFor="confirm">한 번 더 입력</label>
        <input id="confirm" name="confirm" type="password" minLength={8} className="input" required autoComplete="new-password" />
      </div>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? "바꾸는 중" : "비밀번호 바꾸기"}</button>
    </form>
  );
}
