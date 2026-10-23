import type { CourseTrack, CourseFormat, CourseStatus, EnrollmentStatus, InstructorStatus } from "./types";

export const TRACK_LABEL: Record<CourseTrack, string> = {
  level: "단계별 과정",
  guest: "초청 원장 클래스",
  brand: "브랜드 교육",
  leadership: "리더십",
  trend: "트렌드",
  etc: "기타",
};

export const FORMAT_LABEL: Record<CourseFormat, string> = {
  offline: "오프라인",
  online: "온라인",
  hybrid: "온·오프라인",
};

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  draft: "작성 중",
  pending_review: "검수 대기",
  published: "공개 중",
  rejected: "반려됨",
  closed: "모집 마감",
};

export const INSTRUCTOR_STATUS_LABEL: Record<InstructorStatus, string> = {
  pending: "심사 대기",
  approved: "승인됨",
  rejected: "반려됨",
  suspended: "활동 중지",
};

export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  requested: "신청 접수",
  approved: "수강 확정",
  canceled: "취소됨",
  completed: "수료",
};

export function formatPrice(price: number | null) {
  if (price === null) return "가격 문의";
  if (price === 0) return "무료";
  return `${price.toLocaleString("ko-KR")}원`;
}

const dateFmt = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Seoul" });

export function formatDate(d: string | null) {
  if (!d) return null;
  return dateFmt.format(new Date(d + (d.length === 10 ? "T00:00:00+09:00" : "")));
}

export function formatRange(start: string | null, end: string | null) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e && start !== end) return `${s} ~ ${e}`;
  return s ?? e ?? null;
}

export function formatDateTime(d: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul",
  }).format(new Date(d));
}
