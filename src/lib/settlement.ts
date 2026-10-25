import { createClient } from "./supabase/server";
import { ORG_LABEL, formatPrice } from "./format";
import type { EnrollmentStatus, OrgType } from "./types";

export interface SettlementRow {
  id: string;
  date: string;            // 수업일(없으면 신청일) YYYY-MM-DD
  dateIsClass: boolean;
  org: string;
  branch: string;
  name: string;
  title: string;
  phone: string;
  course: string;
  session: string;
  price: number | null;
  priceNote: string;
  status: EnrollmentStatus;
  appliedAt: string;
}

const kstDate = (iso: string) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

/** 한 달 동안 수강한(확정·수료) 사람 목록. 기준일 = 회차 시작일, 없으면 신청일 */
export async function loadSettlement(month: string, paidOnly: boolean, courseId?: string) {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const supabase = await createClient();
  let q = supabase
    .from("enrollments")
    .select("id, status, created_at, applicant_name, applicant_phone, applicant_org_type, applicant_branch, applicant_job_title, course:courses(id, title, price, price_note), session:course_sessions(label, starts_on)")
    .in("status", ["approved", "completed"])
    .gte("created_at", new Date(new Date(start).getTime() - 120 * 864e5).toISOString())
    .lt("created_at", new Date(new Date(next).getTime() + 1 * 864e5).toISOString())
    .limit(10000);
  if (courseId) q = q.eq("course_id", courseId);
  const { data } = await q;
  type Raw = {
    id: string; status: EnrollmentStatus; created_at: string; applicant_name: string; applicant_phone: string;
    applicant_org_type: OrgType | null; applicant_branch: string | null; applicant_job_title: string | null;
    course: { id: string; title: string; price: number | null; price_note: string | null } | null;
    session: { label: string; starts_on: string | null } | null;
  };
  const rows: SettlementRow[] = ((data ?? []) as unknown as Raw[])
    .map((e) => {
      const classDate = e.session?.starts_on ?? null;
      return {
        id: e.id,
        date: classDate ?? kstDate(e.created_at),
        dateIsClass: Boolean(classDate),
        org: e.applicant_org_type ? ORG_LABEL[e.applicant_org_type] : "",
        branch: e.applicant_branch ?? "(소속 미입력)",
        name: e.applicant_name,
        title: e.applicant_job_title ?? "",
        phone: e.applicant_phone,
        course: e.course?.title ?? "",
        session: e.session?.label ?? "",
        price: e.course?.price ?? null,
        priceNote: e.course?.price_note ?? "",
        status: e.status,
        appliedAt: kstDate(e.created_at),
      };
    })
    .filter((r) => r.date >= start && r.date < next)
    .filter((r) => !paidOnly || r.price === null || r.price > 0)
    .sort((a, b) => a.branch.localeCompare(b.branch, "ko") || a.name.localeCompare(b.name, "ko") || a.date.localeCompare(b.date));

  const byBranch = new Map<string, { count: number; total: number; unknown: number }>();
  rows.forEach((r) => {
    const b = byBranch.get(r.branch) ?? { count: 0, total: 0, unknown: 0 };
    b.count++;
    if (r.price === null) b.unknown++;
    else b.total += r.price;
    byBranch.set(r.branch, b);
  });
  return { rows, byBranch: [...byBranch.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko")), priceLabel: formatPrice };
}
