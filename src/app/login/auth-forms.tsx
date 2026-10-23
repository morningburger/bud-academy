"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="field-label" htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" className="input" required autoComplete="current-password" />
      </div>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      <button className="btn-primary btn-lg w-full mt-2" disabled={pending}>{pending ? "로그인하는 중" : "로그인"}</button>
      <p className="text-center text-[14px] text-sub">
        처음이신가요? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-blue font-semibold">회원가입</Link>
      </p>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, null);
  if (state?.info) {
    return (
      <div className="rounded-2xl bg-blue-weak p-6">
        <p className="font-bold text-blue mb-1">메일을 확인해 주세요</p>
        <p className="text-ink-2">{state.info}</p>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="field-label" htmlFor="name">이름</label>
        <input id="name" name="name" className="input" required autoComplete="name" />
      </div>
      <div>
        <label className="field-label" htmlFor="phone">휴대폰 (선택)</label>
        <input id="phone" name="phone" className="input" inputMode="tel" autoComplete="tel" placeholder="01012345678" />
      </div>
      <div>
        <label className="field-label" htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">비밀번호 (8자 이상)</label>
        <input id="password" name="password" type="password" minLength={8} className="input" required autoComplete="new-password" />
      </div>
      <label className="flex items-start gap-2 text-[14px] text-sub">
        <input type="checkbox" name="agree" className="mt-1 accent-[#3182f6]" />
        <span>
          <Link href="/terms" className="underline" target="_blank">이용약관</Link>과{" "}
          <Link href="/privacy" className="underline" target="_blank">개인정보 수집·이용</Link>에 동의합니다
        </span>
      </label>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      <button className="btn-primary btn-lg w-full mt-2" disabled={pending}>{pending ? "가입하는 중" : "가입하기"}</button>
      <p className="text-center text-[14px] text-sub">
        이미 계정이 있나요? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-blue font-semibold">로그인</Link>
      </p>
    </form>
  );
}
