"use client";

import { useActionState } from "react";
import { addLineup, removeLineup, updateLineup, type ActionState } from "@/app/manage/actions";
import { Avatar } from "./avatar";

interface Row { instructor_id: string; role: string | null; position: number; name: string; photo_url: string | null; headline: string | null }

export function LineupEditor({ courseId, rows, options }: { courseId: string; rows: Row[]; options: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addLineup, null);
  const taken = new Set(rows.map((r) => r.instructor_id));
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[14px] text-sub">강좌 페이지의 &lsquo;강사진&rsquo;에 보이는 순서와 역할이에요. 순서는 작은 숫자가 먼저 나와요.</p>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-surface py-10 text-center text-sub">아직 강사진이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.instructor_id} className="panel p-3 flex flex-wrap items-center gap-3">
              <Avatar name={r.name} url={r.photo_url} size={40} />
              <span className="font-bold min-w-24">{r.name}</span>
              <form action={updateLineup} className="flex flex-1 min-w-[260px] gap-2">
                <input type="hidden" name="course_id" value={courseId} />
                <input type="hidden" name="instructor_id" value={r.instructor_id} />
                <input name="position" defaultValue={r.position} inputMode="numeric" className="input h-9 w-16 text-[14px]" aria-label="순서" />
                <input name="role" defaultValue={r.role ?? ""} className="input h-9 text-[14px]" placeholder="역할 (예: 1반 · 수요일)" aria-label="역할" />
                <button className="btn-gray btn-sm shrink-0">저장</button>
              </form>
              <form action={removeLineup}>
                <input type="hidden" name="course_id" value={courseId} />
                <input type="hidden" name="instructor_id" value={r.instructor_id} />
                <button className="btn-gray btn-sm">빼기</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form action={action} className="panel p-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
        <input type="hidden" name="course_id" value={courseId} />
        <div>
          <label className="field-label">강사</label>
          <select name="instructor_id" className="input h-11" defaultValue="">
            <option value="" disabled>강사 고르기</option>
            {options.filter((o) => !taken.has(o.id)).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">역할</label>
          <input name="role" className="input h-11" placeholder="예: 클리퍼 & 드라이" />
        </div>
        <button className="btn-primary h-11" disabled={pending}>추가</button>
        {state?.error && <p className="sm:col-span-3 text-[14px] text-red">{state.error}</p>}
        {state?.ok && <p className="sm:col-span-3 text-[14px] text-green">{state.ok}</p>}
      </form>
      <p className="text-[13px] text-muted">목록에 없는 강사는 관리자 &gt; 강사에서 먼저 등록하세요.</p>
    </div>
  );
}
