import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { ATTENDANCE_LABEL, attendanceRate } from "@/lib/attendance";
import { loadAttendanceBook } from "@/lib/attendance-server";
import { affiliationLine } from "@/lib/format";

function cell(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // 엑셀 수식 주입 방지
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const viewer = await getViewer();
  if (!viewer || !/^[0-9a-f-]{36}$/i.test(sessionId)) return new NextResponse("권한이 없어요.", { status: 403 });
  const book = await loadAttendanceBook(sessionId, viewer);
  if (!book) return new NextResponse("권한이 없어요.", { status: 403 });
  const { session, course, days, students, marks } = book;

  const header = ["이름", "소속", "휴대폰", ...days.map((d, i) => `${i + 1}회차 ${d.class_date}`), "출석", "지각", "결석", "공결", "출석률", "메모"];
  const lines = students.map((st) => {
    const mine = marks.filter((m) => m.enrollment_id === st.id);
    const n = (s: string) => mine.filter((m) => m.status === s).length;
    const rate = attendanceRate(mine);
    const notes = days
      .map((d) => {
        const m = mine.find((x) => x.class_day_id === d.id);
        return m?.note ? `${d.class_date.slice(5)} ${m.note}` : null;
      })
      .filter(Boolean)
      .join(" / ");
    return [
      st.applicant_name,
      affiliationLine(st.applicant_org_type, st.applicant_branch, st.applicant_job_title),
      st.applicant_phone,
      ...days.map((d) => {
        const m = mine.find((x) => x.class_day_id === d.id);
        return m ? ATTENDANCE_LABEL[m.status] : "";
      }),
      n("present"), n("late"), n("absent"), n("excused"),
      rate === null ? "" : `${rate}%`,
      notes,
    ].map(cell).join(",");
  });

  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  const name = `버드아카데미_출석부_${course.title}_${session.label}.csv`.replace(/[\\/:*?"<>|]/g, "_");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "no-store",
    },
  });
}
