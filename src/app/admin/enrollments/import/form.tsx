"use client";

import { useActionState } from "react";
import { importLegacyEnrollments, type ImportState } from "./actions";

export function ImportEnrollmentsForm({ sessions }: { sessions: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(importLegacyEnrollments, null);
  return (
    <form action={action} className="panel p-5 flex flex-col gap-4">
      <div>
        <label className="field-label" htmlFor="session_id">새 사이트의 어느 반으로 옮길까요?</label>
        <select id="session_id" name="session_id" className="input" required defaultValue="">
          <option value="" disabled>회차 선택</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      <input name="file" type="file" accept=".xlsx,.csv" required className="block w-full text-[14px] text-sub file:btn-gray file:btn-sm file:border-0 file:mr-3" />
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}
      <button className="btn-primary self-start px-6" disabled={pending}>{pending ? "옮기는 중" : "신청자 옮기기"}</button>
    </form>
  );
}
