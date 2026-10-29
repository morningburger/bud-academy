import type { Enrollment } from "./types";

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "출석",
  late: "지각",
  absent: "결석",
  excused: "공결",
};

export const ATTENDANCE_ORDER: AttendanceStatus[] = ["present", "late", "absent", "excused"];

export interface ClassDay {
  id: string;
  session_id: string;
  class_date: string;
  title: string | null;
}

export interface AttendanceMark {
  class_day_id: string;
  enrollment_id: string;
  status: AttendanceStatus;
  note: string | null;
  checked_at: string;
}

export type RosterStudent = Pick<
  Enrollment,
  "id" | "status" | "applicant_name" | "applicant_phone" | "applicant_org_type" | "applicant_branch" | "applicant_job_title"
>;

/** 출석률: 공결은 분모에서 빼고, 지각은 출석으로 친다 */
export function attendanceRate(marks: AttendanceMark[]) {
  const counted = marks.filter((m) => m.status !== "excused");
  if (!counted.length) return null;
  const attended = counted.filter((m) => m.status === "present" || m.status === "late").length;
  return Math.round((attended / counted.length) * 100);
}
