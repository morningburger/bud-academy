import Link from "next/link";
import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ENROLLMENT_STATUS_LABEL, formatDateTime, formatRange } from "@/lib/format";
import type { EnrollmentStatus } from "@/lib/types";
import { cancelEnrollment } from "./actions";

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
    .select("*, course:courses(id, title), session:course_sessions(label, starts_on, ends_on, schedule_text)")
    .eq("user_id", viewer.userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Array<{
    id: string; status: EnrollmentStatus; created_at: string;
    course: { id: string; title: string } | null;
    session: { label: string; starts_on: string | null; ends_on: string | null; schedule_text: string | null } | null;
  }>;

  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 pt-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">내 강의실</h1>
          <p className="text-sub mt-1">{viewer.name ?? viewer.email}</p>
        </div>
        <form action="/auth/signout" method="post"><button className="btn-gray btn-sm">로그아웃</button></form>
      </div>

      {!viewer.instructor && (
        <Link href="/partner" className="mt-6 flex items-center justify-between rounded-2xl bg-surface px-5 py-4 hover:bg-surface-strong">
          <span className="text-[15px]"><b>강사로 활동하고 싶다면</b> <span className="text-sub">입점 신청하기</span></span>
          <span className="text-muted" aria-hidden>›</span>
        </Link>
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
          {rows.map((r) => (
            <li key={r.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className={STATUS_CHIP[r.status]}>{ENROLLMENT_STATUS_LABEL[r.status]}</span>
                  <Link href={`/courses/${r.course?.id}`} className="block mt-2 text-[17px] font-bold hover:text-blue">
                    {r.course?.title}
                  </Link>
                  <p className="text-[14px] text-sub mt-0.5">
                    {r.session
                      ? [r.session.label, formatRange(r.session.starts_on, r.session.ends_on), r.session.schedule_text].filter(Boolean).join(" · ")
                      : "회차 없음"}
                  </p>
                  <p className="text-[13px] text-muted mt-1">{formatDateTime(r.created_at)} 신청</p>
                </div>
                {r.status === "requested" && (
                  <form action={cancelEnrollment}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn-gray btn-sm">신청 취소</button>
                  </form>
                )}
              </div>
              {r.status === "requested" && (
                <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[14px] text-sub">
                  담당자가 신청을 확인하고 있어요. 입금 안내를 받은 뒤 입금이 확인되면 수강이 확정돼요.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
