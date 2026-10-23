import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Notice } from "@/lib/types";
import { NoticeForm } from "../form";
import { DeleteNoticeButton } from "./delete-button";

export const metadata: Metadata = { title: "공지 수정" };

export default async function EditNotice({ params }: PageProps<"/admin/notices/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("notices").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const notice = data as Notice;
  return (
    <div>
      <Link href="/admin/notices" className="text-[14px] text-sub hover:text-ink">‹ 공지사항</Link>
      <div className="mt-2 mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">공지 수정</h1>
        <div className="flex gap-2">
          <Link href={`/notices/${notice.id}`} target="_blank" className="btn-gray btn-sm">사이트에서 보기</Link>
          <DeleteNoticeButton id={notice.id} />
        </div>
      </div>
      <NoticeForm notice={notice} />
    </div>
  );
}
