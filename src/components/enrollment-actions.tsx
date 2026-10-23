"use client";

import { useActionState } from "react";
import { resolveCancel, setEnrollmentStatus, type ActionState } from "@/app/manage/actions";
import type { EnrollmentStatus } from "@/lib/types";

const NEXT: Record<EnrollmentStatus, { status: EnrollmentStatus; label: string; cls: string; confirm?: string }[]> = {
  requested: [
    { status: "approved", label: "확정", cls: "btn-primary btn-sm" },
    { status: "canceled", label: "취소", cls: "btn-gray btn-sm" },
  ],
  approved: [
    { status: "completed", label: "수료 처리", cls: "btn-weak btn-sm" },
    { status: "canceled", label: "운영진 취소", cls: "btn-gray btn-sm", confirm: "이 신청을 취소할까요? 수강생 요청 없이 운영진이 직접 취소해요." },
  ],
  canceled: [{ status: "approved", label: "되돌리기", cls: "btn-gray btn-sm" }],
  completed: [{ status: "approved", label: "수료 취소", cls: "btn-gray btn-sm" }],
};

export function EnrollmentActions({ id, status, cancelRequested = false }: { id: string; status: EnrollmentStatus; cancelRequested?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setEnrollmentStatus, null);
  const [cState, cAction, cPending] = useActionState<ActionState, FormData>(resolveCancel, null);
  const error = state?.error ?? cState?.error;

  if (status === "approved" && cancelRequested) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1.5">
          <form action={cAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value="approve" />
            <button className="btn-primary btn-sm" disabled={cPending}>취소 승인</button>
          </form>
          <form action={cAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value="reject" />
            <button className="btn-gray btn-sm" disabled={cPending}>거절</button>
          </form>
        </div>
        {error && <p className="text-[13px] text-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {NEXT[status].map((n) => (
          <form
            key={n.status}
            action={action}
            onSubmit={(e) => {
              if (n.confirm && !window.confirm(n.confirm)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={n.status} />
            <button className={n.cls} disabled={pending}>{n.label}</button>
          </form>
        ))}
      </div>
      {error && <p className="text-[13px] text-red">{error}</p>}
    </div>
  );
}
