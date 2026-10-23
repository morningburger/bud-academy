import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EnrollmentActions } from "@/components/enrollment-actions";
import { EnrollmentStatusChip } from "@/components/status-chip";
import { formatDateTime } from "@/lib/format";
import { STATUS_FILTERS, queryEnrollments } from "@/lib/admin-enrollments";

export const metadata: Metadata = { title: "수강 신청" };

export default async function AdminEnrollments({ searchParams }: PageProps<"/admin/enrollments">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "requested";
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
        <a href={`/admin/enrollments/export${qs({})}`} className="btn-gray btn-sm">엑셀로 내려받기</a>
      </div>
      <p className="mt-1 text-sub text-[15px]">입금이 확인되면 &lsquo;입금 확인·확정&rsquo;을 눌러 주세요. 정원이 찬 회차는 확정되지 않아요.</p>

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
        <input name="q" defaultValue={q} className="input h-11" placeholder="이름 또는 휴대폰 번호" aria-label="검색" />
        <button className="btn-primary h-11">찾기</button>
      </form>

      <p className="mt-6 mb-2 text-[14px] text-sub">{rows.length}건</p>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-surface py-14 text-center text-sub">조건에 맞는 신청이 없어요.</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((e) => (
            <li key={e.id} className="py-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <EnrollmentStatusChip s={e.status} />
                  <span className="font-bold">{e.applicant_name}</span>
                  <a href={`tel:${e.applicant_phone}`} className="text-[14px] text-blue">{e.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}</a>
                </div>
                <Link href={`/manage/courses/${e.course?.id}`} className="block text-[14px] text-ink-2 mt-1 hover:text-blue">
                  {e.course?.title}{e.session ? ` · ${e.session.label}` : ""}
                </Link>
                <p className="text-[13px] text-muted">{formatDateTime(e.created_at)} 신청</p>
                {e.message && <p className="text-[14px] text-ink-2 mt-1 whitespace-pre-line">{e.message}</p>}
              </div>
              <EnrollmentActions id={e.id} status={e.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
