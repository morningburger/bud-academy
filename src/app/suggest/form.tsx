"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitSuggestion, type SuggestState } from "./actions";
import { SUGGESTION_CATEGORY } from "@/lib/format";

export function SuggestForm() {
  const [state, action, pending] = useActionState<SuggestState, FormData>(submitSuggestion, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="flex flex-col gap-4">
      <fieldset>
        <legend className="field-label">종류</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(SUGGESTION_CATEGORY).map(([v, l], i) => (
            <label key={v} className="flex h-11 items-center justify-center rounded-xl border border-line text-[15px] font-semibold text-sub cursor-pointer has-[:checked]:border-blue has-[:checked]:bg-blue-weak has-[:checked]:text-blue">
              <input type="radio" name="category" value={v} defaultChecked={i === 0} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="field-label" htmlFor="body">내용</label>
        <textarea id="body" name="body" rows={6} maxLength={2000} required className="input textarea-input"
          placeholder={"예: 남자 투블럭 컷 과정이 있으면 좋겠어요\n예: OO살롱 OO 원장님 초청 교육을 듣고 싶어요"} />
      </div>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}
      <button className="btn-primary btn-lg w-full" disabled={pending}>{pending ? "보내는 중" : "건의 보내기"}</button>
    </form>
  );
}
