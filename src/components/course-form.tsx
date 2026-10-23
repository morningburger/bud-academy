"use client";

import { useActionState } from "react";
import type { Course, Instructor } from "@/lib/types";
import { TRACK_LABEL, FORMAT_LABEL } from "@/lib/format";
import { saveCourse, type ActionState } from "@/app/manage/actions";

export function CourseForm({
  course,
  isAdmin,
  instructors,
  defaultOfficial,
}: {
  course: Course | null;
  isAdmin: boolean;
  instructors: Pick<Instructor, "id" | "name">[];
  defaultOfficial?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCourse, null);
  const canSendToReview = !isAdmin && (!course || course.status === "draft" || course.status === "rejected");
  const seller = course ? (course.is_official ? "official" : course.instructor_id ?? "") : defaultOfficial ? "official" : "";

  return (
    <form action={action} className="flex flex-col gap-5">
      {course && <input type="hidden" name="id" value={course.id} />}

      {isAdmin && (
        <div>
          <label className="field-label" htmlFor="seller">판매자</label>
          <select id="seller" name="seller" className="input" defaultValue={seller} required>
            <option value="official">버드아카데미 직영</option>
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.name} 강사</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="field-label" htmlFor="title">강좌 이름</label>
        <input id="title" name="title" className="input" required defaultValue={course?.title ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="summary">한 줄 요약</label>
        <input id="summary" name="summary" className="input" maxLength={120} defaultValue={course?.summary ?? ""} placeholder="목록과 상세 상단에 보여요" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="track">분야</label>
          <select id="track" name="track" className="input" defaultValue={course?.track ?? "etc"}>
            {Object.entries(TRACK_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="format">방식</label>
          <select id="format" name="format" className="input" defaultValue={course?.format ?? "offline"}>
            {Object.entries(FORMAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="price">수강료 (원, 비우면 가격 문의)</label>
          <input id="price" name="price" className="input" inputMode="numeric" defaultValue={course?.price ?? ""} />
        </div>
        <div>
          <label className="field-label" htmlFor="audience">대상</label>
          <input id="audience" name="audience" className="input" defaultValue={course?.audience ?? ""} placeholder="예: 3년 차 이상 디자이너" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="price_note">수강료 메모</label>
          <input id="price_note" name="price_note" className="input" defaultValue={course?.price_note ?? ""} placeholder="예: 교재비 8만원 별도" />
        </div>
        <div>
          <label className="field-label" htmlFor="level">단계 (단계별 과정만)</label>
          <select id="level" name="level" className="input" defaultValue={course?.level ?? ""}>
            <option value="">없음</option>
            <option value="1">LV1</option>
            <option value="2">LV2</option>
            <option value="3">LV3</option>
          </select>
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="schedule_summary">일정 요약</label>
        <input id="schedule_summary" name="schedule_summary" className="input" defaultValue={course?.schedule_summary ?? ""} placeholder="예: 매주 목요일 10:00~16:00 · 4회" />
      </div>
      <div>
        <label className="field-label" htmlFor="eligibility">수강 자격 (선택)</label>
        <input id="eligibility" name="eligibility" className="input" defaultValue={course?.eligibility ?? ""} placeholder="예: 고정현헤어 소속 인턴만 수강할 수 있어요." />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="cancel_deadline_days">취소 마감 (수업 며칠 전까지)</label>
          <input id="cancel_deadline_days" name="cancel_deadline_days" type="number" min={0} max={60} className="input" defaultValue={course?.cancel_deadline_days ?? 7} />
          <p className="mt-1 text-[12px] text-muted">기본 7일 전. 회차에 시작일이 있어야 자동으로 막혀요.</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-line px-4 h-12 sm:mt-[26px] text-[15px] cursor-pointer">
          <input type="checkbox" name="internal_only" defaultChecked={course?.internal_only ?? false} className="accent-[#3182f6] size-4" />
          고정현헤어 소속만 신청 가능
        </label>
      </div>
      <div>
        <label className="field-label" htmlFor="location">장소</label>
        <input id="location" name="location" className="input" defaultValue={course?.location ?? ""} placeholder="예: 고정현헤어 아카데미룸 (회차마다 다르면 비워두세요)" />
      </div>
      <div>
        <label className="field-label" htmlFor="description">강좌 소개</label>
        <textarea id="description" name="description" rows={8} className="input textarea-input" defaultValue={course?.description ?? ""} placeholder="무엇을 배우는지, 진행 방식, 준비물, 커리큘럼" />
      </div>
      <div>
        <label className="field-label" htmlFor="curriculum">커리큘럼 (한 줄에 하나, 설명은 | 뒤에)</label>
        <textarea id="curriculum" name="curriculum" rows={5} className="input textarea-input" placeholder={"아이롱펌 뿌리볼륨 테크닉\nDAY 1 · 리더로서 나를 세우다 | 리더십의 기초 / 7시간"}
          defaultValue={(course?.curriculum ?? []).map((c) => (c.detail ? `${c.title} | ${c.detail}` : c.title)).join("\n")} />
      </div>
      <div>
        <label className="field-label" htmlFor="materials">준비물 (한 줄에 하나)</label>
        <textarea id="materials" name="materials" rows={3} className="input textarea-input" defaultValue={(course?.materials ?? []).join("\n")} />
      </div>
      <div>
        <label className="field-label" htmlFor="thumbnail">대표 이미지 (선택, 4MB 이하)</label>
        <input id="thumbnail" name="thumbnail" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-[14px] text-sub file:btn-gray file:btn-sm file:border-0 file:mr-3" />
      </div>

      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}

      <div className="flex gap-2">
        <button name="intent" value="draft" className={canSendToReview ? "btn-gray flex-1" : "btn-primary flex-1"} disabled={pending}>
          {pending ? "저장하는 중" : "저장"}
        </button>
        {canSendToReview && (
          <button name="intent" value="review" className="btn-primary flex-1" disabled={pending}>저장하고 검수 요청</button>
        )}
      </div>
    </form>
  );
}
