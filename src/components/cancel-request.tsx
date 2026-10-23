"use client";

import { useActionState, useState } from "react";
import { requestCancel, withdrawCancel, type CancelState } from "@/app/me/actions";

/** 수강생: 확정된 신청의 취소 요청 / 요청 철회 */
export function CancelRequest({
  id, requested, windowOpen, lastDayText,
}: { id: string; requested: boolean; windowOpen: boolean; lastDayText: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CancelState, FormData>(requestCancel, null);

  if (requested || state?.ok) {
    return (
      <div className="mt-4 rounded-xl bg-orange-weak px-4 py-3 text-[14px] text-[#8a5200] flex flex-wrap items-center justify-between gap-2">
        <span>취소 요청을 보냈어요. 운영진이 확인하면 취소돼요.</span>
        <form action={withdrawCancel}>
          <input type="hidden" name="id" value={id} />
          <button className="btn-gray btn-sm">요청 철회</button>
        </form>
      </div>
    );
  }

  if (!windowOpen) {
    return (
      <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[13px] text-sub">
        수업 일정이 가까워 취소할 수 없어요{lastDayText ? ` (취소 마감 ${lastDayText})` : ""}. 양도가 필요하면 수업 1일 전까지 기획본부팀에 알려 주세요.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-muted">{lastDayText ? `${lastDayText}까지 취소 요청할 수 있어요` : "수업 전에 취소 요청할 수 있어요"}</p>
          <button type="button" className="btn-gray btn-sm" onClick={() => setOpen(true)}>취소 요청</button>
        </div>
      ) : (
        <form action={action} className="rounded-xl bg-surface p-4 flex flex-col gap-3">
          <input type="hidden" name="id" value={id} />
          <label className="field-label !mb-0" htmlFor={`reason-${id}`}>취소 사유 (선택)</label>
          <input id={`reason-${id}`} name="reason" maxLength={300} className="input" placeholder="예: 지점 일정 변경" />
          {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary btn-sm" disabled={pending}>{pending ? "보내는 중" : "취소 요청 보내기"}</button>
            <button type="button" className="btn-gray btn-sm" onClick={() => setOpen(false)}>닫기</button>
          </div>
        </form>
      )}
    </div>
  );
}
