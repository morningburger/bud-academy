import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EnrollmentItem } from "@/components/enrollment-item";
import { DEFAULT_STATUS, STATUS_FILTERS, queryEnrollments } from "@/lib/admin-enrollments";

export const metadata: Metadata = { title: "수강 신청" };

export default async function AdminEnrollments({ searchParams }: PageProps<"/admin/enrollments">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : DEFAULT_STATUS;
  const course = typeof sp.course === "string" && sp.course ? sp.course : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const supabase = await createClient();
  const [rows, { data: courses }] = await Promise.all([
    queryEnrollments({ status, course, q }),
    supabase.from("courses").select("id, title").order("sort_order"),
  ]);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, course, q: q || undefined, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    return `?${p.toString()}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">수강 신청</h1>
        <div className="flex gap-2">
          <Link href="/admin/enrollments/import" className="btn-gray btn-sm">기존 사이트 신청 옮기기</Link>
          <a href={`/admin/enrollments/export${qs({})}`} className="btn-gray btn-sm">엑셀로 내려받기</a>
        </div>
      </div>
      <p className="mt-1 text-sub text-[15px]">신청은 바로 확정돼요. 수강생이 취소를 요청하면 &lsquo;취소 요청&rsquo;에 모이고, 승인해야 취소돼요.</p>

      <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <Link key={f.value} href={qs({ status: f.value })} className={`${status === f.value ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}>
            {f.label}
          </Link>
        ))}
      </div>

      <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input type="hidden" name="status" value={status} />
        <select name="course" defaultValue={course ?? ""} className="input h-11" aria-label="강좌">
          <option value="">모든 강좌</option>
          {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <input name="q" defaultValue={q} className="input h-11" placeholder="이름, 지점, 휴대폰 번호" aria-label="검색" />
        <button className="btn-primary h-11">찾기</button>
      </form>

      <p className="mt-6 mb-2 text-[14px] text-sub">{rows.length}건</p>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-surface py-14 text-center text-sub">조건에 맞는 신청이 없어요.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((e) => (
            <EnrollmentItem key={e.id} e={e} courseTitle={e.course?.title ?? null} courseId={e.course?.id} sessionLabel={e.session?.label} />
          ))}
        </ul>
      )}
    </div>
  );
}
