"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "./actions";
import { ProfileFields } from "@/components/profile-fields";

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
        <div className="flex items-center justify-between">
          <label className="field-label" htmlFor="password">비밀번호</label>
          <Link href="/login/forgot" className="text-[13px] text-sub hover:text-ink mb-1.5">비밀번호를 잊었어요</Link>
        </div>
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

export function SignupForm({ next, branches }: { next: string; branches: string[] }) {
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
        <label className="field-label" htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" className="input" required autoComplete="email" />
      </div>
      <div>
        <label className="field-label" htmlFor="password">비밀번호 (8자 이상)</label>
        <input id="password" name="password" type="password" minLength={8} className="input" required autoComplete="new-password" />
      </div>
      <div className="h-px bg-line my-1" />
      <p className="text-[14px] text-sub -mb-1">수강 신청할 때 본인 확인에 쓰여요. 기존 버드아카데미 회원이라면 같은 이메일로 가입해 주세요.</p>
      <ProfileFields branches={branches} />
      <label className="flex items-start gap-2 text-[14px] text-sub">
        <input type="checkbox" name="agree" className="mt-1 accent-[#3182f6]" />
        <span>
          <Link href="/terms" className="underline" target="_blank">이용약관</Link>과{" "}
          <Link href="/privacy" className="underline" target="_blank">개인정보 수집·이용</Link>에 동의합니다 (필수)
        </span>
      </label>
      <label className="flex items-start gap-2 text-[14px] text-sub -mt-2">
        <input type="checkbox" name="marketing" className="mt-1 accent-[#3182f6]" />
        <span>새 강좌·이벤트 소식을 문자·이메일로 받을게요 (선택)</span>
      </label>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      <button className="btn-primary btn-lg w-full mt-2" disabled={pending}>{pending ? "가입하는 중" : "가입하기"}</button>
      <p className="text-center text-[14px] text-sub">
        이미 계정이 있나요? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-blue font-semibold">로그인</Link>
      </p>
    </form>
  );
}
