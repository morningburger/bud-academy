import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { DEFAULT_STATUS, queryEnrollments } from "@/lib/admin-enrollments";
import { ENROLLMENT_STATUS_LABEL, ORG_LABEL } from "@/lib/format";

function cell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  // 엑셀 수식 주입 방지 + 따옴표 이스케이프
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return new NextResponse("권한이 없어요.", { status: 403 });
  const sp = request.nextUrl.searchParams;
  const rows = await queryEnrollments({
    status: sp.get("status") ?? DEFAULT_STATUS,
    course: sp.get("course") ?? undefined,
    q: sp.get("q") ?? undefined,
    limit: 5000,
  });
  const fmt = (d: string) => new Date(d).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const header = ["신청일시", "상태", "강좌", "회차", "소속", "지점·살롱", "이름", "직급", "휴대폰", "남긴 말", "취소 요청일시", "취소 사유", "취소일시"];
  const lines = rows.map((r) =>
    [fmt(r.created_at), r.status === "approved" && r.cancel_requested_at ? "취소 요청" : ENROLLMENT_STATUS_LABEL[r.status],
      r.course?.title, r.session?.label, r.applicant_org_type ? ORG_LABEL[r.applicant_org_type] : "", r.applicant_branch,
      r.applicant_name, r.applicant_job_title, r.applicant_phone, r.message,
      r.cancel_requested_at ? fmt(r.cancel_requested_at) : "", r.cancel_reason, r.canceled_at ? fmt(r.canceled_at) : ""].map(cell).join(","),
  );
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`버드아카데미_수강신청_${date}.csv`)}`,
      "Cache-Control": "no-store",
    },
  });
}
