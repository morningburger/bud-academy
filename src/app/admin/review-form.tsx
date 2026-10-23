import { reviewInstructor } from "@/app/manage/actions";
import type { Instructor } from "@/lib/types";

export function ReviewForm({ i }: { i: Instructor & { settings: { commission_rate: number; review_note: string | null } | null } }) {
  return (
    <form action={reviewInstructor} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_110px] items-end rounded-xl bg-surface p-3">
      <input type="hidden" name="id" value={i.id} />
      <div>
        <label className="field-label">상태</label>
        <select name="status" className="input h-10 bg-white" defaultValue={i.status}>
          <option value="pending">심사 대기</option>
          <option value="approved">승인</option>
          <option value="rejected">반려</option>
          <option value="suspended">활동 중지</option>
        </select>
      </div>
      <div>
        <label className="field-label">소속</label>
        <select name="affiliation" className="input h-10 bg-white" defaultValue={i.affiliation}>
          <option value="gohair">고정현헤어 소속</option>
          <option value="external">외부 강사</option>
        </select>
      </div>
      <div>
        <label className="field-label">수수료 %</label>
        <input name="commission_rate" className="input h-10 bg-white" inputMode="decimal" defaultValue={i.settings?.commission_rate ?? 20} />
      </div>
      <div className="sm:col-span-3 flex gap-2">
        <input name="review_note" className="input h-10 bg-white" placeholder="심사 메모 (내부용)" defaultValue={i.settings?.review_note ?? ""} />
        <button className="btn-primary btn-sm h-10 shrink-0">저장</button>
      </div>
    </form>
  );
}
