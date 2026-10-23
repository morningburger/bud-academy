"use client";

import { useActionState } from "react";
import { saveNotice, type NoticeState } from "./actions";
import type { Notice } from "@/lib/types";

export function NoticeForm({ notice }: { notice?: Notice }) {
  const [state, action, pending] = useActionState<NoticeState, FormData>(saveNotice, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      {notice && <input type="hidden" name="id" value={notice.id} />}
      <div>
        <label className="field-label" htmlFor="title">제목</label>
        <input id="title" name="title" className="input" required maxLength={120} defaultValue={notice?.title ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="body">내용</label>
        <textarea id="body" name="body" rows={14} className="input textarea-input" required defaultValue={notice?.body ?? ""} />
      </div>
      <div className="flex flex-wrap gap-4 text-[15px]">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_pinned" defaultChecked={notice?.is_pinned ?? false} className="accent-[#3182f6] size-4" />
          중요 공지 (맨 위 고정)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_published" defaultChecked={notice?.is_published ?? true} className="accent-[#3182f6] size-4" />
          사이트에 공개
        </label>
      </div>
      {state?.error && <p className="text-[14px] text-red">{state.error}</p>}
      <button className="btn-primary self-start px-8" disabled={pending}>{pending ? "저장하는 중" : "저장"}</button>
    </form>
  );
}
