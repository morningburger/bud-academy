import Link from "next/link";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { loadInstructorOptions, loadLineup, loadManagedCourse } from "../../load";
import { LineupEditor } from "@/components/lineup-editor";
import { GalleryEditor } from "@/components/gallery-editor";
import { CourseForm } from "@/components/course-form";
import { SessionForm, SessionEditToggle } from "@/components/session-form";
import { EnrollmentItem } from "@/components/enrollment-item";
import { CourseStatusChip } from "@/components/status-chip";
import { deleteSession, setCourseStatus } from "../../actions";
import { formatDate, formatRange } from "@/lib/format";

export default async function ManageCoursePage({ params, searchParams }: PageProps<"/manage/courses/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const viewer = await requireViewer(`/manage/courses/${id}`);
  const { course, sessions, enrollments } = await loadManagedCourse(id);
  if (!course) notFound();
  const isOwner = course.instructor?.user_id === viewer.userId;
  if (!viewer.isAdmin && !isOwner) notFound();
  const [instructors, lineup] = viewer.isAdmin ? await Promise.all([loadInstructorOptions(), loadLineup(id)]) : [[], []];
  const sessionLabel = new Map(sessions.map((s) => [s.id, s.label]));
  const TABS: [string, string][] = [
    ["enrollments", "신청자"],
    ["sessions", "회차"],
    ...(viewer.isAdmin ? ([["lineup", "강사진"]] as [string, string][]) : []),
    ["info", "강좌 정보"],
    ["photos", "사진"],
  ];
  const active = TABS.some(([k]) => k === tab) ? (tab as string) : "enrollments";
  const waiting = enrollments.filter((e) => e.status === "approved" && e.cancel_requested_at).length;

  return (
    <div className="mx-auto max-w-[880px] px-4 sm:px-6 pt-8">
      <Link href={viewer.isAdmin ? "/admin/courses" : "/studio"} className="text-[14px] text-sub hover:text-ink">
        ‹ {viewer.isAdmin ? "관리자" : "강사 스튜디오"}
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CourseStatusChip s={course.status} />
            <span className="text-[14px] text-muted">{course.is_official ? "직영" : course.instructor?.name}</span>
          </div>
          <h1 className="mt-1.5 text-[26px] font-extrabold tracking-[-0.04em]">{course.title}</h1>
        </div>
        <Link href={`/courses/${course.id}`} className="btn-gray btn-sm" target="_blank">강좌 페이지 보기</Link>
      </div>

      {course.status === "rejected" && course.review_note && (
        <div className="mt-4 rounded-xl bg-red-weak px-4 py-3 text-[14px] text-red">반려 사유: {course.review_note}</div>
      )}
      {course.status === "pending_review" && !viewer.isAdmin && (
        <div className="mt-4 rounded-xl bg-orange-weak px-4 py-3 text-[14px] text-[#a35f00]">검수 중이에요. 승인되면 강좌 페이지가 공개돼요.</div>
      )}

      {viewer.isAdmin && (
        <div className="mt-5 panel p-4 flex flex-wrap items-end gap-2">
          {course.status !== "published" && (
            <form action={setCourseStatus}>
              <input type="hidden" name="id" value={course.id} />
              <input type="hidden" name="status" value="published" />
              <input type="hidden" name="review_note" value="" />
              <button className="btn-primary btn-sm">승인하고 공개</button>
            </form>
          )}
          {course.status === "published" && (
            <form action={setCourseStatus}>
              <input type="hidden" name="id" value={course.id} />
              <input type="hidden" name="status" value="closed" />
              <button className="btn-gray btn-sm">모집 마감</button>
            </form>
          )}
          {course.status !== "rejected" && !course.is_official && (
            <form action={setCourseStatus} className="flex flex-1 min-w-[260px] gap-2">
              <input type="hidden" name="id" value={course.id} />
              <input type="hidden" name="status" value="rejected" />
              <input name="review_note" className="input h-9 text-[14px]" placeholder="반려 사유 (강사에게 보여요)" required />
              <button className="btn-danger btn-sm shrink-0">반려</button>
            </form>
          )}
          {course.status !== "draft" && (
            <form action={setCourseStatus}>
              <input type="hidden" name="id" value={course.id} />
              <input type="hidden" name="status" value="draft" />
              <button className="btn-gray btn-sm">비공개로</button>
            </form>
          )}
        </div>
      )}
      {!viewer.isAdmin && (course.status === "published" || course.status === "closed") && (
        <form action={setCourseStatus} className="mt-5">
          <input type="hidden" name="id" value={course.id} />
          <input type="hidden" name="status" value={course.status === "published" ? "closed" : "published"} />
          <button className="btn-gray btn-sm">{course.status === "published" ? "모집 마감하기" : "모집 다시 열기"}</button>
        </form>
      )}

      <nav className="mt-8 flex gap-1 border-b border-line overflow-x-auto">
        {TABS.map(([key, base]) => [key, key === "enrollments" && waiting ? `${base} (취소 요청 ${waiting})` : base]).map(([key, label]) => (
          <Link
            key={key}
            href={`?tab=${key}`}
            className={`px-4 h-11 inline-flex items-center whitespace-nowrap text-[15px] font-semibold border-b-2 -mb-px ${
              active === key ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink-2"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="pt-6">
        {active === "enrollments" && (
          enrollments.length === 0 ? (
            <p className="rounded-2xl bg-surface py-14 text-center text-sub">아직 신청자가 없어요.</p>
          ) : (
            <ul className="divide-y divide-line">
              {enrollments.map((e) => (
                <EnrollmentItem key={e.id} e={e} sessionLabel={e.session_id ? sessionLabel.get(e.session_id) : null} />
              ))}
            </ul>
          )
        )}

        {active === "sessions" && (
          <div className="flex flex-col gap-6">
            {sessions.length > 0 && (
              <ul className="divide-y divide-line border-y border-line">
                {sessions.map((s) => {
                  const taken = enrollments.filter((e) => e.session_id === s.id && e.status !== "canceled").length;
                  return (
                    <li key={s.id} className="py-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {s.label}{" "}
                          {s.status !== "open" && <span className="chip-gray ml-1">{s.status === "closed" ? "마감" : "취소"}</span>}
                        </p>
                        <p className="text-[14px] text-sub">
                          {[formatRange(s.starts_on, s.ends_on), s.schedule_text, s.location, s.apply_deadline ? `${formatDate(s.apply_deadline)}까지 신청` : null, `확정 ${taken}${s.capacity ? `/${s.capacity}` : ""}명`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        <SessionEditToggle courseId={course.id} session={s} />
                        <form action={deleteSession}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="course_id" value={course.id} />
                          <button className="btn-gray btn-sm">삭제</button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="panel p-5">
              <h2 className="font-bold mb-4">회차 추가</h2>
              <SessionForm courseId={course.id} />
            </div>
          </div>
        )}

        {active === "lineup" && viewer.isAdmin && (
          <LineupEditor courseId={course.id} rows={lineup} options={instructors} />
        )}

        {active === "photos" && (
          <GalleryEditor courseId={course.id} images={course.gallery ?? []} cover={course.thumbnail_url} />
        )}

        {active === "info" && (
          <CourseForm course={course} isAdmin={viewer.isAdmin} instructors={instructors} />
        )}
      </div>
    </div>
  );
}
