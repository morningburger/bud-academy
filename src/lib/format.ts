import type { CourseTrack, CourseFormat, CourseStatus, EnrollmentStatus, InstructorStatus, OrgType } from "./types";

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

export const TEAM_LABEL: Record<string, string> = {
  director: "총괄 디렉터",
  trend: "트렌드팀",
  education: "교육팀",
};

export const JOB_TITLES = ["인턴", "디자이너", "팀장", "실장", "점장", "부원장", "원장", "대표", "본사 직원", "기타"];

export const ORG_LABEL: Record<OrgType, string> = { gohair: "고정현헤어", external: "다른 살롱" };

/** 예: (부평점) 인턴 · 고정현헤어 / (OO살롱) 디자이너 */
export function affiliationLine(org: OrgType | null | undefined, branch: string | null | undefined, title: string | null | undefined) {
  if (!org && !branch && !title) return null;
  const where = branch ? (org === "external" ? branch : `고정현헤어 ${branch}`) : org ? ORG_LABEL[org] : "";
  return [where, title].filter(Boolean).join(" · ");
}

/** 한국 날짜 YYYY-MM-DD */
export function todayKST() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export function addDays(ymd: string, days: number) {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 취소 요청 마지막 날 (수업일 - N일). 수업일이 없으면 null = 언제든 요청 가능 */
export function cancelLastDay(startsOn: string | null | undefined, deadlineDays: number) {
  return startsOn ? addDays(startsOn, -deadlineDays) : null;
}

export function cancelWindowOpen(startsOn: string | null | undefined, deadlineDays: number) {
  const last = cancelLastDay(startsOn, deadlineDays);
  return last === null || todayKST() <= last;
}

export function applyOpen(applyDeadline: string | null | undefined) {
  return !applyDeadline || todayKST() <= applyDeadline;
}

export const SUGGESTION_CATEGORY: Record<string, string> = {
  topic: "듣고 싶은 교육",
  instructor: "강사 추천",
  operation: "운영 건의",
  etc: "기타",
};

export const SUGGESTION_STATUS: Record<string, string> = { new: "새 건의", read: "확인함", done: "반영·답변 완료" };
