import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getViewer } from "@/lib/auth";
import { loadSettlement } from "@/lib/settlement";
import { ENROLLMENT_STATUS_LABEL } from "@/lib/format";

const safe = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);

export async function GET(request: NextRequest) {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return new NextResponse("권한이 없어요.", { status: 403 });
  const sp = request.nextUrl.searchParams;
  const month = /^\d{4}-\d{2}$/.test(sp.get("month") ?? "") ? sp.get("month")! : new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
  const paidOnly = sp.get("paid") !== "0";
  const course = sp.get("course") || undefined;
  const { rows, byBranch } = await loadSettlement(month, paidOnly, course);

  const wb = new ExcelJS.Workbook();
  wb.creator = "버드아카데미";
  const ws = wb.addWorksheet("수강자 명단", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "지점·살롱", key: "branch", width: 16 },
    { header: "소속", key: "org", width: 10 },
    { header: "이름", key: "name", width: 12 },
    { header: "직급", key: "title", width: 10 },
    { header: "휴대폰", key: "phone", width: 15 },
    { header: "강좌", key: "course", width: 34 },
    { header: "회차", key: "session", width: 26 },
    { header: "수업일", key: "date", width: 12 },
    { header: "수강료(원)", key: "price", width: 12 },
    { header: "추가 비용·비고", key: "note", width: 22 },
    { header: "상태", key: "status", width: 10 },
    { header: "신청일", key: "applied", width: 12 },
  ];
  rows.forEach((r) =>
    ws.addRow({
      branch: safe(r.branch), org: r.org, name: safe(r.name), title: safe(r.title),
      phone: r.phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3"),
      course: safe(r.course), session: safe(r.session),
      date: r.dateIsClass ? r.date : `${r.date} (신청일)`,
      price: r.price, note: r.price === null ? "가격 문의(직접 확인)" : safe(r.priceNote),
      status: ENROLLMENT_STATUS_LABEL[r.status], applied: r.appliedAt,
    }),
  );
  ws.getColumn("price").numFmt = "#,##0";
  ws.getRow(1).font = { bold: true };
  ws.autoFilter = { from: "A1", to: "L1" };

  const sum = wb.addWorksheet("지점별 합계");
  sum.columns = [
    { header: "지점·살롱", key: "branch", width: 18 },
    { header: "인원(건)", key: "count", width: 10 },
    { header: "수강료 합계(원)", key: "total", width: 16 },
    { header: "가격 미정 건수", key: "unknown", width: 14 },
  ];
  byBranch.forEach(([branch, b]) => sum.addRow({ branch: safe(branch), count: b.count, total: b.total, unknown: b.unknown || "" }));
  sum.addRow({ branch: "합계", count: rows.length, total: byBranch.reduce((s, [, b]) => s + b.total, 0) }).font = { bold: true };
  sum.getColumn("total").numFmt = "#,##0";
  sum.getRow(1).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  const name = `버드아카데미_수강자정산_${month}${paidOnly ? "_유료" : ""}.xlsx`;
  return new NextResponse(buf as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "no-store",
    },
  });
}
