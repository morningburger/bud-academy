import Link from "next/link";
import type { Metadata } from "next";
import { listNotices } from "@/lib/queries";

export const metadata: Metadata = { title: "공지사항" };

const dateFmt = (d: string) => new Date(d).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

export default async function NoticesPage() {
  const notices = await listNotices();
  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 pt-10">
      <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">공지사항</h1>
      <p className="mt-1 text-sub">수강 신청 전에 꼭 확인해 주세요.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {notices.length === 0 && <li className="py-14 text-center text-sub">아직 공지가 없어요.</li>}
        {notices.map((n) => (
          <li key={n.id}>
            <Link href={`/notices/${n.id}`} className="flex items-center justify-between gap-4 py-4 hover:bg-surface -mx-3 px-3 rounded-xl">
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  {n.is_pinned && <span className="chip-blue shrink-0">중요</span>}
                  <span className="font-bold truncate">{n.title}</span>
                </span>
                <span className="block text-[14px] text-sub truncate mt-0.5">{n.body.replace(/\s+/g, " ").slice(0, 80)}</span>
              </span>
              <span className="text-[13px] text-muted shrink-0">{dateFmt(n.created_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
