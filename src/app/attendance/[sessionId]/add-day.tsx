"use client";

import { useActionState } from "react";
import { addClassDay, type ActionState } from "../actions";

export function AddDayForm({ sessionId, defaultDate, primary = false }: { sessionId: string; defaultDate: string; primary?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addClassDay, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="session_id" value={sessionId} />
      <div>
        <label className="field-label" htmlFor="class_date">수업 날짜</label>
        <input id="class_date" type="date" name="class_date" defaultValue={defaultDate} required className="input h-10 w-[170px] text-[15px]" />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label className="field-label" htmlFor="title">메모 (선택)</label>
        <input id="title" name="title" className="input h-10 text-[15px]" placeholder="예: 2회차 · 커트 실습" maxLength={60} />
      </div>
      <button className={`${primary ? "btn-primary" : "btn-gray"} btn-sm h-10`} disabled={pending}>
        {primary ? "출석 부르기 시작" : "수업일 추가"}
      </button>
      {state?.error && <p className="w-full text-[13px] text-red">{state.error}</p>}
    </form>
  );
}
