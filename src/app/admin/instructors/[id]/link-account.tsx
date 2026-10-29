"use client";

import { useActionState } from "react";
import { linkInstructorAccount, type AdminState } from "../../actions";

export function LinkAccountForm({ id, linkedEmail }: { id: string; linkedEmail: string | null }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(linkInstructorAccount, null);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {linkedEmail !== null ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3">
          <span className="text-[15px]">연결된 계정: <b>{linkedEmail || "이메일 없음"}</b></span>
          <button
            name="op"
            value="unlink"
            className="btn-gray btn-sm"
            disabled={pending}
            onClick={(e) => { if (!window.confirm("계정 연결을 끊을까요? 이 강사는 더 이상 출석을 부를 수 없어요.")) e.preventDefault(); }}
          >
            연결 끊기
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input name="email" type="email" required className="input h-11" placeholder="강사가 가입한 이메일" aria-label="이메일" />
          <button className="btn-primary h-11 shrink-0" disabled={pending}>{pending ? "연결 중" : "계정 연결"}</button>
        </div>
      )}
      {state?.error && <p className="mt-2 text-[14px] text-red">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-[14px] text-green">{state.ok}</p>}
    </form>
  );
}
