import Link from "next/link";
import type { Metadata } from "next";
import { requireApprovedInstructor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CourseStatusChip, InstructorStatusChip } from "@/components/status-chip";
import { Avatar } from "@/components/avatar";
import type { Course } from "@/lib/types";

export const metadata: Metadata = { title: "강사 스튜디오" };

export default async function StudioPage() {
  const viewer = await requireApprovedInstructor();
  const me = viewer.instructor;
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*, enrollments(status)")
    .eq("instructor_id", me.id)
    .order("created_at", { ascending: false });
  const courses = (data ?? []) as (Course & { enrollments: { status: string }[] })[];
  const approved = me.status === "approved";

  return (
    <div className="mx-auto max-w-[880px] px-4 sm:px-6 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={me.name} url={me.photo_url} />
          <div>
            <h1 className="text-[24px] font-extrabold tracking-[-0.04em]">{me.name} 강사 스튜디오</h1>
            <div className="mt-1 flex items-center gap-2 text-[14px] text-sub">
              <InstructorStatusChip s={me.status} />
              <Link href="/studio/profile" className="hover:text-ink">프로필 수정</Link>
              {approved && <Link href={`/instructors/${me.id}`} className="hover:text-ink">공개 프로필 보기</Link>}
            </div>
          </div>
        </div>
        {approved && <Link href="/manage/courses/new" className="btn-primary">새 강좌 만들기</Link>}
      </div>

      {!approved && (
        <div className="mt-6 rounded-2xl bg-surface p-5 text-[15px] text-sub">
          {me.status === "pending" && "입점 심사가 진행 중이에요. 승인되면 이곳에서 강좌를 만들 수 있어요."}
          {me.status === "rejected" && <>입점 신청이 반려됐어요. <Link href="/partner/apply" className="text-blue font-semibold">신청서를 보완해 다시 보내기</Link></>}
          {me.status === "suspended" && "활동이 일시 중지된 상태예요. 버드아카데미에 문의해 주세요."}
        </div>
      )}

      {approved && (
        <>
          <h2 className="mt-10 mb-3 text-[18px] font-bold">내 강좌</h2>
          {courses.length === 0 ? (
            <div className="rounded-2xl bg-surface py-14 text-center text-sub">
              첫 강좌를 만들어 보세요.
              <br />
              <Link href="/manage/courses/new" className="text-blue font-semibold">새 강좌 만들기</Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {courses.map((c) => {
                const waiting = c.enrollments.filter((e) => e.status === "requested").length;
                const confirmed = c.enrollments.filter((e) => e.status === "approved" || e.status === "completed").length;
                return (
                  <li key={c.id}>
                    <Link href={`/manage/courses/${c.id}`} className="panel flex items-center justify-between gap-4 p-5 hover:bg-[#fafbfc]">
                      <div className="min-w-0">
                        <CourseStatusChip s={c.status} />
                        <p className="mt-1.5 font-bold truncate">{c.title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {waiting > 0 && <p className="text-[14px] font-bold text-orange">새 신청 {waiting}</p>}
                        <p className="text-[13px] text-muted">확정 {confirmed}명</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
