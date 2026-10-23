import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Notice } from "@/lib/types";

export const metadata: Metadata = { title: "공지사항" };

export default async function AdminNotices() {
  const supabase = await createClient();
  const { data } = await supabase.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
  const notices = (data ?? []) as Notice[];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">공지사항</h1>
        <Link href="/admin/notices/new" className="btn-primary btn-sm">공지 쓰기</Link>
      </div>
      <p className="mt-1 text-sub text-[15px]">&lsquo;중요&rsquo; 공지는 목록 맨 위에 고정돼요.</p>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {notices.length === 0 && <li className="py-10 text-center text-sub">아직 공지가 없어요.</li>}
        {notices.map((n) => (
          <li key={n.id}>
            <Link href={`/admin/notices/${n.id}`} className="flex items-center justify-between gap-3 py-4 hover:bg-surface -mx-3 px-3 rounded-xl">
              <span className="flex items-center gap-2 min-w-0">
                {n.is_pinned && <span className="chip-blue shrink-0">중요</span>}
                {!n.is_published && <span className="chip-gray shrink-0">비공개</span>}
                <span className="font-bold truncate">{n.title}</span>
              </span>
              <span className="text-[13px] text-muted shrink-0">{new Date(n.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
