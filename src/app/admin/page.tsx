import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { reviewInstructor } from "@/app/manage/actions";
import { CourseStatusChip, EnrollmentStatusChip, InstructorStatusChip } from "@/components/status-chip";
import { EnrollmentActions } from "@/components/enrollment-actions";
import { Avatar } from "@/components/avatar";
import { AddInstructorForm } from "./admin-forms";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Course, Enrollment, Instructor } from "@/lib/types";

export const metadata: Metadata = { title: "관리자" };

type Tab = "enrollments" | "instructors" | "courses";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === "instructors" || tabParam === "courses" ? tabParam : "enrollments";
  const supabase = await createClient();

  const [{ data: ins }, { data: crs }, { data: enr }] = await Promise.all([
    supabase.from("instructors").select("*, settings:instructor_settings(commission_rate, review_note)").order("created_at", { ascending: false }),
    supabase.from("courses").select("*, instructor:instructors(name)").order("updated_at", { ascending: false }),
    supabase
      .from("enrollments")
      .select("*, course:courses(id, title), session:course_sessions(label)")
      .in("status", ["requested", "approved"])
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const instructors = (ins ?? []) as (Instructor & { settings: { commission_rate: number; review_note: string | null } | null })[];
  const courses = (crs ?? []) as (Course & { instructor: { name: string } | null })[];
  const enrollments = (enr ?? []) as (Enrollment & { course: { id: string; title: string } | null; session: { label: string } | null })[];

  const pendingInstructors = instructors.filter((i) => i.status === "pending").length;
  const pendingCourses = courses.filter((c) => c.status === "pending_review").length;
  const newRequests = enrollments.filter((e) => e.status === "requested").length;

  const tabs: [Tab, string, number][] = [
    ["enrollments", "수강 신청", newRequests],
    ["instructors", "강사", pendingInstructors],
    ["courses", "강좌", pendingCourses],
  ];

  return (
    <div className="mx-auto max-w-[960px] px-4 sm:px-6 pt-10">
      <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">관리자</h1>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {tabs.map(([key, label, count]) => (
          <Link
            key={key}
            href={`/admin?tab=${key}`}
            className={`rounded-2xl p-4 transition-colors ${tab === key ? "bg-ink text-white" : "bg-surface hover:bg-surface-strong"}`}
          >
            <p className={`text-[14px] ${tab === key ? "text-[#b0b8c1]" : "text-sub"}`}>{label}</p>
            <p className="mt-1 text-[22px] font-extrabold tracking-[-0.03em]">
              {count}
              <span className="text-[14px] font-semibold ml-1">{key === "enrollments" ? "건 대기" : "건 심사"}</span>
            </p>
          </Link>
        ))}
      </div>

      <div className="pt-8">
        {tab === "enrollments" && (
          enrollments.length === 0 ? (
            <p className="rounded-2xl bg-surface py-14 text-center text-sub">처리할 신청이 없어요.</p>
          ) : (
            <ul className="divide-y divide-line">
              {enrollments.map((e) => (
                <li key={e.id} className="py-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <EnrollmentStatusChip s={e.status} />
                      <span className="font-bold">{e.applicant_name}</span>
                      <a href={`tel:${e.applicant_phone}`} className="text-[14px] text-blue">{e.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}</a>
                    </div>
                    <Link href={`/manage/courses/${e.course?.id}`} className="block text-[14px] text-ink-2 mt-1 hover:text-blue">
                      {e.course?.title}{e.session ? ` · ${e.session.label}` : ""}
                    </Link>
                    <p className="text-[13px] text-muted">{formatDateTime(e.created_at)} 신청</p>
                    {e.message && <p className="text-[14px] text-ink-2 mt-1">{e.message}</p>}
                  </div>
                  <EnrollmentActions id={e.id} status={e.status} />
                </li>
              ))}
            </ul>
          )
        )}

        {tab === "instructors" && (
          <div className="flex flex-col gap-8">
            {instructors.length === 0 ? (
              <p className="rounded-2xl bg-surface py-14 text-center text-sub">아직 강사가 없어요. 아래에서 소속 디자이너를 먼저 등록할 수 있어요.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {instructors.map((i) => (
                  <li key={i.id} className="panel p-5">
                    <div className="flex items-start gap-4">
                      <Avatar name={i.name} url={i.photo_url} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <InstructorStatusChip s={i.status} />
                          <span className="font-bold">{i.name}</span>
                          <span className="text-[13px] text-muted">
                            {i.affiliation === "gohair" ? "고정현헤어" : "외부"}{i.branch_name ? ` · ${i.branch_name}` : ""}
                            {i.user_id ? "" : " · 계정 미연결"}
                          </span>
                        </div>
                        {i.headline && <p className="text-[14px] text-sub mt-1">{i.headline}</p>}
                        {i.career && <p className="text-[14px] text-ink-2 mt-2 whitespace-pre-line">{i.career}</p>}
                        {i.bio && <p className="text-[14px] text-ink-2 mt-2 whitespace-pre-line line-clamp-4">{i.bio}</p>}
                        {i.instagram && <p className="text-[13px] text-muted mt-1">@{i.instagram}</p>}
                      </div>
                    </div>
                    <form action={reviewInstructor} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_110px] items-end rounded-xl bg-surface p-3">
                      <input type="hidden" name="id" value={i.id} />
                      <div>
                        <label className="field-label">상태</label>
                        <select name="status" className="input h-10 bg-white" defaultValue={i.status}>
                          <option value="pending">심사 대기</option>
                          <option value="approved">승인</option>
                          <option value="rejected">반려</option>
                          <option value="suspended">활동 중지</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label">소속</label>
                        <select name="affiliation" className="input h-10 bg-white" defaultValue={i.affiliation}>
                          <option value="gohair">고정현헤어 소속</option>
                          <option value="external">외부 강사</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label">수수료 %</label>
                        <input name="commission_rate" className="input h-10 bg-white" inputMode="decimal" defaultValue={i.settings?.commission_rate ?? 20} />
                      </div>
                      <div className="sm:col-span-3 flex gap-2">
                        <input name="review_note" className="input h-10 bg-white" placeholder="심사 메모 (내부용)" defaultValue={i.settings?.review_note ?? ""} />
                        <button className="btn-primary btn-sm h-10 shrink-0">저장</button>
                      </div>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            <div className="panel p-5">
              <h2 className="font-bold">강사 직접 등록</h2>
              <p className="text-[14px] text-sub mt-1 mb-4">소속 디자이너를 계정 없이 먼저 등록하고, 관리자가 대신 강좌를 열 수 있어요.</p>
              <AddInstructorForm />
            </div>
          </div>
        )}

        {tab === "courses" && (
          <div>
            <div className="flex justify-end mb-4">
              <Link href="/manage/courses/new?official=1" className="btn-primary">새 강좌 만들기</Link>
            </div>
            <ul className="flex flex-col gap-2">
              {[...courses]
                .sort((a, b) => Number(b.status === "pending_review") - Number(a.status === "pending_review"))
                .map((c) => (
                  <li key={c.id}>
                    <Link href={`/manage/courses/${c.id}`} className="panel flex items-center justify-between gap-4 p-5 hover:bg-[#fafbfc]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CourseStatusChip s={c.status} />
                          <span className="text-[13px] text-muted">{c.is_official ? "직영" : c.instructor?.name}</span>
                        </div>
                        <p className="mt-1.5 font-bold truncate">{c.title}</p>
                      </div>
                      <span className="text-[14px] text-sub shrink-0">{formatPrice(c.price)}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
