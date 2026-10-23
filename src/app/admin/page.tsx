import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EnrollmentItem } from "@/components/enrollment-item";
import { formatDate, formatRange, todayKST } from "@/lib/format";
import type { Enrollment } from "@/lib/types";

type Row = Enrollment & { course: { id: string; title: string } | null; session: { label: string } | null };

export default async function AdminHome() {
  const supabase = await createClient();
  const today = todayKST();
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const select = "*, course:courses(id, title), session:course_sessions(label)";

  const [{ data: cancels, count: cancelCount }, { data: recent }, { count: weekCount }, { data: sessions }, { count: members }] = await Promise.all([
    supabase.from("enrollments").select(select, { count: "exact" }).eq("status", "approved").not("cancel_requested_at", "is", null)
      .order("cancel_requested_at", { ascending: true }).limit(10),
    supabase.from("enrollments").select(select).neq("status", "canceled").order("created_at", { ascending: false }).limit(6),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).gte("created_at", weekAgo).neq("status", "canceled"),
    supabase
      .from("course_sessions")
      .select("*, course:courses!inner(id, title, status), enrollments(status)")
      .eq("status", "open")
      .eq("course.status", "published")
      .or(`apply_deadline.is.null,apply_deadline.gte.${today}`)
      .order("starts_on", { nullsFirst: false })
      .order("label"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const cancelRows = (cancels ?? []) as Row[];
  const recentRows = (recent ?? []) as Row[];
  const open = ((sessions ?? []) as {
    id: string; label: string; starts_on: string | null; ends_on: string | null; capacity: number | null; apply_deadline: string | null;
    course: { id: string; title: string } | null; enrollments: { status: string }[];
  }[]).filter((s) => !s.starts_on || s.starts_on >= today);

  const stats = [
    { label: "처리할 취소 요청", value: cancelCount ?? 0, href: "/admin/enrollments?status=cancel", tone: (cancelCount ?? 0) > 0 },
    { label: "최근 7일 신청", value: weekCount ?? 0, href: "/admin/enrollments?status=all" },
    { label: "모집 중인 회차", value: open.length, href: "/admin/courses" },
    { label: "가입 회원", value: members ?? 0, href: "/admin/members" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">한눈에 보기</h1>
        <div className="flex gap-2">
          <Link href="/manage/courses/new?official=1" className="btn-primary btn-sm">새 강좌 만들기</Link>
          <Link href="/admin/notices/new" className="btn-gray btn-sm">공지 쓰기</Link>
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

      {cancelRows.length > 0 && (
        <section className="mt-10">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-[18px] font-bold">취소 요청</h2>
            <Link href="/admin/enrollments?status=cancel" className="text-[14px] text-sub hover:text-ink">전체 보기</Link>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {cancelRows.map((e) => (
              <EnrollmentItem key={e.id} e={e} courseTitle={e.course?.title ?? null} courseId={e.course?.id} sessionLabel={e.session?.label} />
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-[18px] font-bold mb-3">모집 중인 회차</h2>
        {open.length === 0 ? (
          <p className="rounded-2xl bg-surface py-10 text-center text-sub">모집 중인 회차가 없어요. 강좌·회차에서 다음 반을 추가해 주세요.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {open.map((s) => {
              const confirmed = s.enrollments.filter((e) => e.status !== "canceled").length;
              return (
                <li key={s.id}>
                  <Link href={`/manage/courses/${s.course?.id}?tab=enrollments`} className="block rounded-2xl border border-line p-4 hover:bg-surface">
                    <p className="text-[13px] font-semibold text-blue">
                      {[formatRange(s.starts_on, s.ends_on), s.apply_deadline ? `${formatDate(s.apply_deadline)} 신청 마감` : null].filter(Boolean).join(" · ") || "일정 미정"}
                    </p>
                    <p className="mt-0.5 font-bold truncate">{s.course?.title}</p>
                    <p className="text-[14px] text-sub">{s.label} · 신청 {confirmed}{s.capacity ? `/${s.capacity}` : ""}명</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-[18px] font-bold">최근 신청</h2>
          <Link href="/admin/enrollments" className="text-[14px] text-sub hover:text-ink">전체 보기</Link>
        </div>
        {recentRows.length === 0 ? (
          <p className="rounded-2xl bg-surface py-10 text-center text-sub">아직 신청이 없어요.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {recentRows.map((e) => (
              <EnrollmentItem key={e.id} e={e} courseTitle={e.course?.title ?? null} courseId={e.course?.id} sessionLabel={e.session?.label} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
