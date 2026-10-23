"use client";

import { useActionState } from "react";
import { addStaffByEmail, type AdminState } from "../actions";

export function AddStaffForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(addStaffByEmail, null);
  return (
    <form action={action}>
      <div className="flex gap-2">
        <input name="email" type="email" required className="input h-11" placeholder="직원이 가입한 이메일" aria-label="이메일" />
        <button className="btn-primary h-11 shrink-0" disabled={pending}>{pending ? "주는 중" : "권한 주기"}</button>
      </div>
      {state?.error && <p className="mt-2 text-[14px] text-red">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-[14px] text-green">{state.ok}</p>}
    </form>
  );
}
