import { createClient } from "./supabase/server";
import type { Enrollment, EnrollmentStatus } from "./types";

export type EnrollmentRow = Enrollment & {
  course: { id: string; title: string } | null;
  session: { label: string; starts_on: string | null } | null;
};

export const STATUS_FILTERS: { value: EnrollmentStatus | "all"; label: string }[] = [
  { value: "requested", label: "신청 접수" },
  { value: "approved", label: "수강 확정" },
  { value: "completed", label: "수료" },
  { value: "canceled", label: "취소" },
  { value: "all", label: "전체" },
];

export async function queryEnrollments(opts: { status?: string; course?: string; q?: string; limit?: number }) {
  const supabase = await createClient();
  let q = supabase
    .from("enrollments")
    .select("*, course:courses(id, title), session:course_sessions(label, starts_on)")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 500);
  const status = opts.status ?? "requested";
  if (status !== "all") q = q.eq("status", status);
  if (opts.course) q = q.eq("course_id", opts.course);
  if (opts.q) {
    const term = opts.q.replace(/[%,()]/g, "");
    const digits = term.replace(/[^0-9]/g, "");
    q = digits.length >= 4 ? q.ilike("applicant_phone", `%${digits}%`) : q.ilike("applicant_name", `%${term}%`);
  }
  const { data } = await q;
  return (data ?? []) as EnrollmentRow[];
}
