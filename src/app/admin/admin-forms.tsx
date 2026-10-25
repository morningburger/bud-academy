"use client";

import { useActionState } from "react";
import { createInstructorByAdmin, type ActionState } from "@/app/manage/actions";

export function AddInstructorForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createInstructorByAdmin, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="field-label">이름</label>
        <input name="name" className="input" required />
      </div>
      <div>
        <label className="field-label">강사진 구분</label>
        <select name="team" className="input" defaultValue="education">
          <option value="education">내부 · 교육팀</option>
          <option value="trend">내부 · 트렌드팀</option>
          <option value="director">내부 · 총괄 디렉터</option>
          <option value="">외부 초청 강사</option>
        </select>
      </div>
      <div>
        <label className="field-label">지점·소속명</label>
        <input name="branch_name" className="input" placeholder="예: 서창점" />
      </div>
      <div>
        <label className="field-label">한 줄 소개</label>
        <input name="headline" className="input" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "등록하는 중" : "강사 등록"}</button>
        {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
        {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}
      </div>
    </form>
  );
}
