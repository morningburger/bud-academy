"use client";

import { useActionState } from "react";
import { setEnrollmentStatus, type ActionState } from "@/app/manage/actions";
import type { EnrollmentStatus } from "@/lib/types";

const NEXT: Record<EnrollmentStatus, { status: EnrollmentStatus; label: string; cls: string }[]> = {
  requested: [
    { status: "approved", label: "입금 확인·확정", cls: "btn-primary btn-sm" },
    { status: "canceled", label: "취소", cls: "btn-gray btn-sm" },
  ],
  approved: [
    { status: "completed", label: "수료 처리", cls: "btn-weak btn-sm" },
    { status: "canceled", label: "취소", cls: "btn-gray btn-sm" },
  ],
  canceled: [{ status: "requested", label: "되돌리기", cls: "btn-gray btn-sm" }],
  completed: [],
};

export function EnrollmentActions({ id, status }: { id: string; status: EnrollmentStatus }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setEnrollmentStatus, null);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {NEXT[status].map((n) => (
          <form key={n.status} action={action}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={n.status} />
            <button className={n.cls} disabled={pending}>{n.label}</button>
          </form>
        ))}
      </div>
      {state?.error && <p className="text-[13px] text-red">{state.error}</p>}
    </div>
  );
}
