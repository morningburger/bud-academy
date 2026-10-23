import { createClient } from "./supabase/server";
import type { Enrollment } from "./types";

export type EnrollmentRow = Enrollment & {
  course: { id: string; title: string } | null;
  session: { label: string; starts_on: string | null } | null;
};

export const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "approved", label: "수강 확정" },
  { value: "cancel", label: "취소 요청" },
  { value: "completed", label: "수료" },
  { value: "canceled", label: "취소됨" },
  { value: "all", label: "전체" },
];

export const DEFAULT_STATUS = "approved";

export async function queryEnrollments(opts: { status?: string; course?: string; q?: string; limit?: number }) {
  const supabase = await createClient();
  let q = supabase
    .from("enrollments")
    .select("*, course:courses(id, title), session:course_sessions(label, starts_on)")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 500);
  const status = opts.status ?? DEFAULT_STATUS;
  if (status === "cancel") q = q.eq("status", "approved").not("cancel_requested_at", "is", null);
  else if (status !== "all") q = q.eq("status", status);
  if (opts.course) q = q.eq("course_id", opts.course);
  if (opts.q) {
    const term = opts.q.replace(/[%,().*"\\]/g, "").trim();
    const digits = term.replace(/[^0-9]/g, "");
    if (digits.length >= 4) q = q.ilike("applicant_phone", `%${digits}%`);
    else if (term) q = q.or(`applicant_name.ilike.%${term}%,applicant_branch.ilike.%${term}%`);
  }
  const { data } = await q;
  return (data ?? []) as EnrollmentRow[];
}
