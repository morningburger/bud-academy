import Link from "next/link";
import type { Metadata } from "next";
import { NoticeForm } from "../form";

export const metadata: Metadata = { title: "공지 쓰기" };

export default function NewNotice() {
  return (
    <div>
      <Link href="/admin/notices" className="text-[14px] text-sub hover:text-ink">‹ 공지사항</Link>
      <h1 className="mt-2 mb-6 text-[26px] font-extrabold tracking-[-0.04em]">공지 쓰기</h1>
      <NoticeForm />
    </div>
  );
}
