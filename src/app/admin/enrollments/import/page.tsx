import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ImportEnrollmentsForm } from "./form";

export const metadata: Metadata = { title: "기존 신청 옮기기" };

export default async function ImportEnrollmentsPage() {
  const supabase = await createClient();
  const [{ data: sessions }, { data: legacy }] = await Promise.all([
    supabase.from("course_sessions").select("id, label, status, course:courses(title, sort_order)").neq("status", "canceled"),
    supabase.from("legacy_enrollments").select("session_id, raw_name, email, phone, enrollment_id"),
  ]);
  type S = { id: string; label: string; status: string; course: { title: string; sort_order: number } | null };
  const list = ((sessions ?? []) as unknown as S[])
    .sort((a, b) => (a.course?.sort_order ?? 0) - (b.course?.sort_order ?? 0) || b.label.localeCompare(a.label))
    .map((s) => ({ id: s.id, label: `${s.course?.title ?? ""} · ${s.label}`, open: s.status === "open" }));
  const bySession = new Map<string, { raw_name: string | null; email: string | null; phone: string | null; enrollment_id: string | null }[]>();
  (legacy ?? []).forEach((l) => bySession.set(l.session_id, [...(bySession.get(l.session_id) ?? []), l]));

  return (
    <div className="max-w-[720px]">
      <Link href="/admin/enrollments" className="text-[14px] text-sub hover:text-ink">‹ 수강 신청</Link>
      <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.04em]">기존 사이트 신청 옮기기</h1>
      <ol className="mt-4 mb-6 flex flex-col gap-2 text-[15px] text-ink-2 list-decimal pl-5">
        <li>기존 사이트 관리 &gt; 상품 &gt; 해당 반 &gt; 수강생 탭에서 수강생 목록을 내려받아요.</li>
        <li>여기서 새 사이트의 같은 반을 고르고 파일을 올려요. 반마다 한 번씩 하면 돼요.</li>
        <li>이미 가입한 회원은 바로 &lsquo;수강 확정&rsquo;으로 들어가요. 아직 가입 안 한 사람은 같은 이메일(또는 휴대폰)로 가입하는 순간 자동으로 들어가요.</li>
      </ol>
      <ImportEnrollmentsForm sessions={list.filter((s) => s.open)} />

      <h2 className="mt-12 mb-3 text-[18px] font-bold">옮긴 신청</h2>
      {bySession.size === 0 ? (
        <p className="rounded-2xl bg-surface py-10 text-center text-sub">아직 옮긴 신청이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.filter((s) => bySession.has(s.id)).map((s) => {
            const rows = bySession.get(s.id)!;
            const linked = rows.filter((r) => r.enrollment_id).length;
            return (
              <li key={s.id} className="panel p-5">
                <p className="font-bold">{s.label}</p>
                <p className="text-[14px] text-sub">{rows.length}명 중 {linked}명 가입·연결 완료, {rows.length - linked}명 가입 대기</p>
                {rows.length - linked > 0 && (
                  <p className="mt-2 text-[13px] text-muted">
                    가입 대기: {rows.filter((r) => !r.enrollment_id).map((r) => r.raw_name ?? r.email ?? r.phone).join(", ")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
