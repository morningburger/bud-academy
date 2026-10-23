import Link from "next/link";
import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ENROLLMENT_STATUS_LABEL, affiliationLine, cancelLastDay, cancelWindowOpen, formatDate, formatDateTime, formatRange } from "@/lib/format";
import type { EnrollmentStatus } from "@/lib/types";
import { CancelRequest } from "@/components/cancel-request";

export const metadata: Metadata = { title: "내 강의실" };

const STATUS_CHIP: Record<EnrollmentStatus, string> = {
  requested: "chip-orange",
  approved: "chip-blue",
  canceled: "chip-gray",
  completed: "chip-green",
};

export default async function MePage() {
  const viewer = await requireViewer("/me");
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("*, course:courses(id, title, cancel_deadline_days), session:course_sessions(label, starts_on, ends_on, schedule_text, location)")
    .eq("user_id", viewer.userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Array<{
    id: string; status: EnrollmentStatus; created_at: string; cancel_requested_at: string | null; canceled_at: string | null;
    course: { id: string; title: string; cancel_deadline_days: number } | null;
    session: { label: string; starts_on: string | null; ends_on: string | null; schedule_text: string | null; location: string | null } | null;
  }>;
  const line = affiliationLine(viewer.orgType, viewer.branch, viewer.jobTitle);

  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 pt-10">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">내 강의실</h1>
          <p className="text-sub mt-1 truncate">{viewer.name ?? viewer.email}{line ? ` · ${line}` : ""}</p>
        </div>
        <form action="/auth/signout" method="post"><button className="btn-gray btn-sm">로그아웃</button></form>
      </div>

      {!viewer.profileComplete ? (
        <Link href="/me/profile" className="mt-6 flex items-center justify-between rounded-2xl bg-orange-weak px-5 py-4">
          <span className="text-[15px] text-[#8a5200]"><b>소속·직급을 입력해 주세요</b> · 입력해야 수강 신청을 할 수 있어요</span>
          <span aria-hidden className="text-[#8a5200]">›</span>
        </Link>
      ) : (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/me/profile" className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4 hover:bg-surface-strong">
            <span className="text-[15px]"><b>회원 정보</b> <span className="text-sub">소속·직급·연락처</span></span>
            <span className="text-muted" aria-hidden>›</span>
          </Link>
          {!viewer.instructor && (
            <Link href="/partner" className="flex items-center justify-between rounded-2xl bg-surface px-5 py-4 hover:bg-surface-strong">
              <span className="text-[15px]"><b>강사로 활동하기</b> <span className="text-sub">입점 신청</span></span>
              <span className="text-muted" aria-hidden>›</span>
            </Link>
          )}
        </div>
      )}

      <h2 className="mt-10 mb-3 text-[18px] font-bold">신청한 강좌</h2>
      {rows.length === 0 ? (
        <div className="rounded-2xl bg-surface py-14 text-center text-sub">
          아직 신청한 강좌가 없어요.
          <br />
          <Link href="/courses" className="text-blue font-semibold">강좌 둘러보기</Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const days = r.course?.cancel_deadline_days ?? 7;
            const last = cancelLastDay(r.session?.starts_on, days);
            const cancelRequested = r.status === "approved" && Boolean(r.cancel_requested_at);
            return (
              <li key={r.id} className="panel p-5">
                <span className={cancelRequested ? "chip-orange" : STATUS_CHIP[r.status]}>
                  {cancelRequested ? "취소 요청 중" : ENROLLMENT_STATUS_LABEL[r.status]}
                </span>
                <Link href={`/courses/${r.course?.id}`} className="block mt-2 text-[17px] font-bold hover:text-blue">
                  {r.course?.title}
                </Link>
                <p className="text-[14px] text-sub mt-0.5">
                  {r.session
                    ? [r.session.label, formatRange(r.session.starts_on, r.session.ends_on), r.session.schedule_text, r.session.location].filter(Boolean).join(" · ")
                    : "회차 없음"}
                </p>
                <p className="text-[13px] text-muted mt-1">
                  {formatDateTime(r.created_at)} 신청{r.canceled_at ? ` · ${formatDateTime(r.canceled_at)} 취소` : ""}
                </p>
                {r.status === "approved" && (
                  <CancelRequest
                    id={r.id}
                    requested={cancelRequested}
                    windowOpen={cancelWindowOpen(r.session?.starts_on, days)}
                    lastDayText={last ? formatDate(last) : null}
                  />
                )}
                {r.status === "requested" && (
                  <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[14px] text-sub">담당자가 신청을 확인하고 있어요.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
