"use client";

import { useActionState } from "react";
import { ProfileFields, type ProfileDefaults } from "@/components/profile-fields";
import { saveProfile, type ProfileState } from "./actions";

export function ProfileForm({
  branches, defaults, marketing, next,
}: { branches: string[]; defaults: ProfileDefaults; marketing: boolean; next: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <ProfileFields branches={branches} defaults={defaults} />
      <label className="flex items-start gap-2 text-[14px] text-sub">
        <input type="checkbox" name="marketing" defaultChecked={marketing} className="mt-1 accent-[#3182f6]" />
        <span>새 강좌·이벤트 소식을 문자·이메일로 받을게요 (선택)</span>
      </label>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}
      <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? "저장하는 중" : next ? "저장하고 신청하러 가기" : "저장"}</button>
    </form>
  );
}
