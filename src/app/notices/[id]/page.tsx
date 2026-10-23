import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Notice } from "@/lib/types";

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("notices").select("*").eq("id", id).maybeSingle();
  return data as Notice | null;
}

export async function generateMetadata({ params }: PageProps<"/notices/[id]">): Promise<Metadata> {
  const n = await load((await params).id);
  return { title: n?.title ?? "공지사항" };
}

export default async function NoticePage({ params }: PageProps<"/notices/[id]">) {
  const n = await load((await params).id);
  if (!n) notFound();
  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 pt-10">
      <Link href="/notices" className="text-[14px] text-sub hover:text-ink">‹ 공지사항</Link>
      <div className="mt-3 flex items-center gap-2">
        {n.is_pinned && <span className="chip-blue">중요</span>}
        {!n.is_published && <span className="chip-gray">비공개</span>}
        <span className="text-[13px] text-muted">{new Date(n.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</span>
      </div>
      <h1 className="mt-2 text-[24px] sm:text-[28px] font-extrabold leading-snug tracking-[-0.04em]">{n.title}</h1>
      <div className="mt-6 border-t border-line pt-6 text-[16px] leading-[1.85] text-ink-2 whitespace-pre-line break-words">{n.body}</div>
    </div>
  );
}
