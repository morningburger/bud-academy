"use client";

import { deleteNotice } from "../actions";

export function DeleteNoticeButton({ id }: { id: string }) {
  return (
    <form action={deleteNotice} onSubmit={(e) => { if (!window.confirm("이 공지를 삭제할까요? 되돌릴 수 없어요.")) e.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <button className="btn-gray btn-sm text-red">삭제</button>
    </form>
  );
}
