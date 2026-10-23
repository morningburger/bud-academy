"use client";

import { useActionState } from "react";
import type { Instructor } from "@/lib/types";
import type { FormState } from "@/app/partner/apply/actions";

export function InstructorForm({
  action,
  instructor,
  submitLabel,
  defaultName,
}: {
  action: (prev: FormState, form: FormData) => Promise<FormState>;
  instructor: Instructor | null;
  submitLabel: string;
  defaultName?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label className="field-label" htmlFor="name">활동명</label>
        <input id="name" name="name" className="input" required defaultValue={instructor?.name ?? defaultName ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="headline">한 줄 소개</label>
        <input id="headline" name="headline" className="input" placeholder="예: 10년 차 열펌 전문 디자이너" defaultValue={instructor?.headline ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="branch_name">소속 (살롱·지점명)</label>
        <input id="branch_name" name="branch_name" className="input" placeholder="예: 고정현헤어 송도학원가점" defaultValue={instructor?.branch_name ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="bio">소개</label>
        <textarea id="bio" name="bio" rows={4} className="input textarea-input" placeholder="어떤 디자이너인지, 무엇을 가르치고 싶은지" defaultValue={instructor?.bio ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="career">경력</label>
        <textarea id="career" name="career" rows={4} className="input textarea-input" placeholder="한 줄에 하나씩 적어 주세요" defaultValue={instructor?.career ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="instagram">인스타그램 (선택)</label>
        <input id="instagram" name="instagram" className="input" placeholder="@" defaultValue={instructor?.instagram ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="photo">프로필 사진 (선택, 4MB 이하)</label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-[14px] text-sub file:btn-gray file:btn-sm file:border-0 file:mr-3" />
      </div>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? "저장하는 중" : submitLabel}</button>
    </form>
  );
}
