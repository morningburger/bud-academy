import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCourse, listSessions } from "@/lib/queries";
import { getViewer } from "@/lib/auth";
import { CourseThumb } from "@/components/course-card";
import { SellerBadge } from "@/components/badges";
import { Avatar } from "@/components/avatar";
import { CATEGORY_LABEL, FORMAT_LABEL, formatPrice, formatRange } from "@/lib/format";
import { ApplyForm } from "./apply-form";
import { createClient } from "@/lib/supabase/server";
import type { EnrollmentStatus } from "@/lib/types";
import { ENROLLMENT_STATUS_LABEL } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/courses/[id]">): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourse(id);
  return { title: course?.title ?? "강좌", description: course?.summary ?? undefined };
}

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [course, viewer] = await Promise.all([getCourse(id), getViewer()]);
  if (!course) notFound();
  const sessions = await listSessions(id);
  type MyEnrollment = { status: EnrollmentStatus; session_id: string | null };
  let myEnrollment: MyEnrollment | null = null;
  if (viewer) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("enrollments")
      .select("status, session_id")
      .eq("course_id", id)
      .eq("user_id", viewer.userId)
      .neq("status", "canceled")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    myEnrollment = (data as MyEnrollment | null) ?? null;
  }
  const isPublic = course.status === "published" || course.status === "closed";
  const instructor = course.instructor;

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-8">
      {!isPublic && (
        <div className="mb-6 rounded-xl bg-orange-weak px-4 py-3 text-[14px] text-[#a35f00]">
          미리보기 화면이에요. 이 강좌는 아직 공개되지 않았어요.
        </div>
      )}
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <CourseThumb course={course} className="aspect-[16/9] w-full rounded-3xl" />
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <SellerBadge isOfficial={course.is_official} instructor={instructor} />
            <span className="chip-gray">{CATEGORY_LABEL[course.category]}</span>
            <span className="chip-gray">{FORMAT_LABEL[course.format]}</span>
          </div>
          <h1 className="mt-3 text-[28px] sm:text-[34px] font-extrabold leading-tight tracking-[-0.04em]">{course.title}</h1>
          {course.summary && <p className="mt-3 text-[17px] leading-relaxed text-sub">{course.summary}</p>}

          <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden bg-line">
            <div className="bg-white p-4"><dt className="text-[13px] text-muted">수강료</dt><dd className="mt-1 font-bold">{formatPrice(course.price)}</dd></div>
            <div className="bg-white p-4"><dt className="text-[13px] text-muted">대상</dt><dd className="mt-1 font-bold">{course.audience ?? "누구나"}</dd></div>
            <div className="bg-white p-4 col-span-2 sm:col-span-1"><dt className="text-[13px] text-muted">장소</dt><dd className="mt-1 font-bold">{course.location ?? (course.format === "online" ? "온라인" : "회차별 안내")}</dd></div>
          </dl>

          {course.description && (
            <section className="mt-10">
              <h2 className="text-[20px] font-bold mb-3">강좌 소개</h2>
              <div className="text-[16px] leading-[1.8] text-ink-2 whitespace-pre-line">{course.description}</div>
            </section>
          )}

          {sessions.length > 0 && (
            <section className="mt-10">
              <h2 className="text-[20px] font-bold mb-3">진행 일정</h2>
              <ul className="divide-y divide-line border-y border-line">
                {sessions.map((s) => (
                  <li key={s.id} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{s.label}</p>
                      <p className="text-[14px] text-sub">
                        {[formatRange(s.starts_on, s.ends_on), s.schedule_text, s.location].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {s.capacity && (
                      <span className={s.taken >= s.capacity ? "chip-gray" : "chip-blue"}>
                        {s.taken >= s.capacity ? "마감" : `${s.capacity - s.taken}자리 남음`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-[20px] font-bold mb-3">{course.is_official ? "운영" : "강사"}</h2>
            {course.is_official ? (
              <div className="rounded-2xl bg-surface p-5">
                <p className="font-bold">버드아카데미 직영</p>
                <p className="text-[15px] text-sub mt-1">버드아카데미가 직접 기획하고 운영하는 강좌예요.</p>
              </div>
            ) : instructor ? (
              <Link href={`/instructors/${instructor.id}`} className="flex items-center gap-4 rounded-2xl bg-surface p-5 hover:bg-surface-strong">
                <Avatar name={instructor.name} url={instructor.photo_url} />
                <div className="min-w-0">
                  <p className="font-bold flex items-center gap-1.5">
                    {instructor.name}
                    <SellerBadge isOfficial={false} instructor={instructor} />
                  </p>
                  <p className="text-[14px] text-sub truncate">{instructor.headline ?? instructor.branch_name ?? ""}</p>
                </div>
              </Link>
            ) : null}
            {!course.is_official && (
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                이 강좌의 판매자는 {instructor?.name} 강사이며, 버드아카데미는 통신판매중개자로서 강좌 내용과 진행의 당사자가 아닙니다.
              </p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 self-start panel p-5">
          <p className="text-[14px] text-sub">{course.title}</p>
          <p className="mt-1 mb-5 text-[24px] font-extrabold tracking-[-0.03em]">{formatPrice(course.price)}</p>
          {myEnrollment !== null ? (
            <div className="rounded-2xl bg-blue-weak p-5">
              <p className="font-bold text-blue mb-1">{ENROLLMENT_STATUS_LABEL[myEnrollment.status]}</p>
              <p className="text-[15px] text-ink-2">
                {myEnrollment.status === "requested" && "신청이 접수됐어요. 확인 후 입금 안내를 드려요."}
                {myEnrollment.status === "approved" && "수강이 확정됐어요."}
                {myEnrollment.status === "completed" && "수료한 강좌예요."}
                {myEnrollment.session_id && ` (${sessions.find((s) => s.id === myEnrollment.session_id)?.label ?? ""})`}
              </p>
              <Link href="/me" className="btn-primary w-full mt-4">내 강의실에서 보기</Link>
            </div>
          ) : (
          <ApplyForm
            courseId={course.id}
            signedIn={Boolean(viewer)}
            defaultName={viewer?.name ?? ""}
            defaultPhone={viewer?.phone ?? ""}
            closed={course.status !== "published"}
            sessions={sessions
              .filter((s) => s.status === "open")
              .map((s) => ({
                id: s.id,
                label: s.label,
                detail: [formatRange(s.starts_on, s.ends_on), s.schedule_text].filter(Boolean).join(" · ") || null,
                full: s.capacity !== null && s.taken >= s.capacity,
              }))}
          />
          )}
        </aside>
      </div>
    </div>
  );
}
