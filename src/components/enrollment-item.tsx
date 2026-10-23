import Link from "next/link";
import { EnrollmentActions } from "./enrollment-actions";
import { EnrollmentStatusChip } from "./status-chip";
import { affiliationLine, formatDateTime } from "@/lib/format";
import type { Enrollment } from "@/lib/types";

/** 관리 화면의 신청 한 줄 (전체 신청 목록, 대시보드, 강좌별 신청자) */
export function EnrollmentItem({
  e, courseTitle, courseId, sessionLabel,
}: { e: Enrollment; courseTitle?: string | null; courseId?: string | null; sessionLabel?: string | null }) {
  const cancelRequested = e.status === "approved" && Boolean(e.cancel_requested_at);
  const line = affiliationLine(e.applicant_org_type, e.applicant_branch, e.applicant_job_title);
  return (
    <li className="py-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {cancelRequested ? <span className="chip-orange">취소 요청</span> : <EnrollmentStatusChip s={e.status} />}
          <span className="font-bold">{e.applicant_name}</span>
          <a href={`tel:${e.applicant_phone}`} className="text-[14px] text-blue">{e.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}</a>
        </div>
        {line && <p className="text-[14px] text-ink-2 mt-0.5">{line}</p>}
        {courseTitle !== undefined ? (
          <Link href={`/manage/courses/${courseId}`} className="block text-[14px] text-ink-2 mt-0.5 hover:text-blue">
            {courseTitle}{sessionLabel ? ` · ${sessionLabel}` : ""}
          </Link>
        ) : sessionLabel ? (
          <p className="text-[14px] text-ink-2 mt-0.5">{sessionLabel}</p>
        ) : null}
        <p className="text-[13px] text-muted">
          {formatDateTime(e.created_at)} 신청
          {e.cancel_requested_at ? ` · ${formatDateTime(e.cancel_requested_at)} 취소 요청` : ""}
          {e.canceled_at ? ` · ${formatDateTime(e.canceled_at)} 취소됨` : ""}
        </p>
        {e.message && <p className="text-[14px] text-ink-2 mt-1 whitespace-pre-line">“{e.message}”</p>}
        {cancelRequested && e.cancel_reason && <p className="text-[14px] text-[#8a5200] mt-1">취소 사유: {e.cancel_reason}</p>}
      </div>
      <EnrollmentActions id={e.id} status={e.status} cancelRequested={cancelRequested} />
    </li>
  );
}
