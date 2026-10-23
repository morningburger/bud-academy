"use client";

import { useActionState } from "react";
import { importLegacyMembers, type ImportState } from "../actions";

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importLegacyMembers, null);
  return (
    <form action={action} className="panel p-5 flex flex-col gap-4">
      <input name="file" type="file" accept=".xlsx,.csv" required className="block w-full text-[14px] text-sub file:btn-gray file:btn-sm file:border-0 file:mr-3" />
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      {state?.ok && <p className="text-[14px] text-green">{state.ok}</p>}
      <button className="btn-primary self-start px-6" disabled={pending}>{pending ? "가져오는 중" : "명단 가져오기"}</button>
    </form>
  );
}
