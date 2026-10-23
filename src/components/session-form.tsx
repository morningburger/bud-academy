"use client";

import { useActionState, useState } from "react";
import type { CourseSession } from "@/lib/types";
import { saveSession, type ActionState } from "@/app/manage/actions";

export function SessionForm({ courseId, session, onDone }: { courseId: string; session?: CourseSession; onDone?: () => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (p, f) => {
    const r = await saveSession(p, f);
    if (r?.ok) onDone?.();
    return r;
  }, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="course_id" value={courseId} />
      {session && <input type="hidden" name="id" value={session.id} />}
      <div>
        <label className="field-label">회차 이름</label>
        <input name="label" className="input" required defaultValue={session?.label ?? ""} placeholder="예: 12기" />
      </div>
      <div>
        <label className="field-label">정원 (비우면 제한 없음)</label>
        <input name="capacity" className="input" inputMode="numeric" defaultValue={session?.capacity ?? ""} />
      </div>
      <div>
        <label className="field-label">시작일 (취소 마감 계산 기준)</label>
        <input name="starts_on" type="date" className="input" defaultValue={session?.starts_on ?? ""} />
      </div>
      <div>
        <label className="field-label">종료일</label>
        <input name="ends_on" type="date" className="input" defaultValue={session?.ends_on ?? ""} />
      </div>
      <div>
        <label className="field-label">신청 마감일 (비우면 모집 마감 전까지)</label>
        <input name="apply_deadline" type="date" className="input" defaultValue={session?.apply_deadline ?? ""} />
      </div>
      <div>
        <label className="field-label">시간 안내</label>
        <input name="schedule_text" className="input" defaultValue={session?.schedule_text ?? ""} placeholder="예: 매주 월 10:00-13:00" />
      </div>
      <div>
        <label className="field-label">장소</label>
        <input name="location" className="input" defaultValue={session?.location ?? ""} />
      </div>
      {session && (
        <div>
          <label className="field-label">모집 상태</label>
          <select name="status" className="input" defaultValue={session.status}>
            <option value="open">모집 중</option>
            <option value="closed">모집 마감</option>
            <option value="canceled">취소 (목록에서 숨김)</option>
          </select>
        </div>
      )}
      <div className="sm:col-span-2 flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "저장하는 중" : session ? "회차 저장" : "회차 추가"}</button>
        {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
        {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}
      </div>
    </form>
  );
}

export function SessionEditToggle({ courseId, session }: { courseId: string; session: CourseSession }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn-gray btn-sm" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? "닫기" : "수정"}
      </button>
      {open && (
        <div className="basis-full mt-3 rounded-xl bg-surface p-4">
          <SessionForm courseId={courseId} session={session} onDone={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
