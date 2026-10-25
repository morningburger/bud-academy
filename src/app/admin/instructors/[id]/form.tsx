"use client";

import { useActionState } from "react";
import type { Instructor } from "@/lib/types";
import { saveInstructorByAdmin, type AdminState } from "../../actions";
import { Avatar } from "@/components/avatar";

export function AdminInstructorForm({ instructor: i }: { instructor: Instructor }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveInstructorByAdmin, null);
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={i.id} />
      <div className="flex items-center gap-4">
        <Avatar name={i.name} url={i.photo_url} size={72} />
        <div className="flex-1">
          <label className="field-label" htmlFor="photo">프로필 사진 (정사각형 권장, 4MB 이하)</label>
          <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-[14px] text-sub file:btn-gray file:btn-sm file:border-0 file:mr-3" />
          {i.photo_url && (
            <label className="mt-2 flex items-center gap-2 text-[14px] text-sub">
              <input type="checkbox" name="remove_photo" className="accent-[#3182f6]" /> 사진 지우기
            </label>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="name">이름·직급</label>
          <input id="name" name="name" className="input" required defaultValue={i.name} />
        </div>
        <div>
          <label className="field-label" htmlFor="branch_name">지점·소속</label>
          <input id="branch_name" name="branch_name" className="input" defaultValue={i.branch_name ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="team">강사진 구분</label>
          <select id="team" name="team" className="input" defaultValue={i.team ?? (i.affiliation === "external" ? "" : "education")}>
            <option value="director">총괄 디렉터</option>
            <option value="trend">트렌드팀</option>
            <option value="education">교육팀</option>
            <option value="">외부 초청 강사</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="sort_order">보이는 순서 (작을수록 앞)</label>
          <input id="sort_order" name="sort_order" type="number" min={0} max={999} className="input" defaultValue={i.sort_order ?? 100} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="headline">한 줄 소개</label>
        <input id="headline" name="headline" className="input" defaultValue={i.headline ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="bio">소개</label>
        <textarea id="bio" name="bio" rows={4} className="input textarea-input" defaultValue={i.bio ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="career">경력 (한 줄에 하나)</label>
        <textarea id="career" name="career" rows={4} className="input textarea-input" defaultValue={i.career ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="instagram">인스타그램</label>
        <input id="instagram" name="instagram" className="input" placeholder="@" defaultValue={i.instagram ?? ""} />
      </div>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}
      <button className="btn-primary btn-lg" disabled={pending}>{pending ? "저장하는 중" : "저장"}</button>
    </form>
  );
}
