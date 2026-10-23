import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EnrollmentActions } from "@/components/enrollment-actions";
import { formatDateTime, formatRange } from "@/lib/format";
import type { Enrollment } from "@/lib/types";

export default async function AdminHome() {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const in30 = new Date(Date.now() + 30 * 864e5).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

  const [{ data: requests, count: requestCount }, { count: approvedCount }, { data: sessions }, { count: members }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("*, course:courses(id, title), session:course_sessions(label)", { count: "exact" })
      .eq("status", "requested")
      .order("created_at", { ascending: true })
      .limit(6),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase
      .from("course_sessions")
      .select("*, course:courses(id, title), enrollments(status)")
      .gte("starts_on", today)
      .lte("starts_on", in30)
      .neq("status", "canceled")
      .order("starts_on"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const rows = (requests ?? []) as (Enrollment & { course: { id: string; title: string } | null; session: { label: string } | null })[];
  const upcoming = (sessions ?? []) as {
    id: string; label: string; starts_on: string | null; ends_on: string | null; capacity: number | null;
    course: { id: string; title: string } | null; enrollments: { status: string }[];
  }[];

  const stats = [
    { label: "확인할 신청", value: requestCount ?? 0, href: "/admin/enrollments", tone: (requestCount ?? 0) > 0 },
    { label: "수강 확정", value: approvedCount ?? 0, href: "/admin/enrollments?status=approved" },
    { label: "30일 안에 열리는 회차", value: upcoming.length, href: "/admin/courses" },
    { label: "가입 회원", value: members ?? 0, href: "/admin/members" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">한눈에 보기</h1>
        <div className="flex gap-2">
          <Link href="/manage/courses/new?official=1" className="btn-primary btn-sm">새 강좌 만들기</Link>
          <Link href="/admin/instructors#add" className="btn-gray btn-sm">강사 등록</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`rounded-2xl p-4 transition-colors ${s.tone ? "bg-blue text-white hover:bg-blue-press" : "bg-surface hover:bg-surface-strong"}`}>
            <p className={`text-[14px] ${s.tone ? "text-[#d3e6ff]" : "text-sub"}`}>{s.label}</p>
            <p className="mt-1 text-[26px] font-extrabold tracking-[-0.03em]">{s.value.toLocaleString("ko-KR")}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-[18px] font-bold">확인을 기다리는 신청</h2>
          <Link href="/admin/enrollments" className="text-[14px] text-sub hover:text-ink">전체 보기</Link>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-surface py-10 text-center text-sub">새로 들어온 신청이 없어요.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {rows.map((e) => (
              <li key={e.id} className="py-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">
                    {e.applicant_name}{" "}
                    <a href={`tel:${e.applicant_phone}`} className="ml-1 text-[14px] font-normal text-blue">{e.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}</a>
                  </p>
                  <Link href={`/manage/courses/${e.course?.id}`} className="block text-[14px] text-ink-2 hover:text-blue">
                    {e.course?.title}{e.session ? ` · ${e.session.label}` : ""}
                  </Link>
                  <p className="text-[13px] text-muted">{formatDateTime(e.created_at)} 신청{e.message ? ` · “${e.message}”` : ""}</p>
                </div>
                <EnrollmentActions id={e.id} status={e.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[18px] font-bold mb-3">30일 안에 열리는 회차</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-2xl bg-surface py-10 text-center text-sub">예정된 회차가 없어요.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {upcoming.map((s) => {
              const confirmed = s.enrollments.filter((e) => e.status === "approved" || e.status === "completed").length;
              const waiting = s.enrollments.filter((e) => e.status === "requested").length;
              return (
                <li key={s.id}>
                  <Link href={`/manage/courses/${s.course?.id}?tab=enrollments`} className="block rounded-2xl border border-line p-4 hover:bg-surface">
                    <p className="text-[13px] font-semibold text-blue">{formatRange(s.starts_on, s.ends_on)}</p>
                    <p className="mt-0.5 font-bold truncate">{s.course?.title}</p>
                    <p className="text-[14px] text-sub">
                      {s.label} · 확정 {confirmed}{s.capacity ? `/${s.capacity}` : ""}명{waiting ? ` · 대기 ${waiting}명` : ""}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
