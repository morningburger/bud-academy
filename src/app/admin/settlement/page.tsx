import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadSettlement } from "@/lib/settlement";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "수강자 정산" };

export default async function SettlementPage({ searchParams }: PageProps<"/admin/settlement">) {
  const sp = await searchParams;
  const thisMonth = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 7);
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : thisMonth;
  const paidOnly = sp.paid !== "0";
  const course = typeof sp.course === "string" && sp.course ? sp.course : undefined;
  const supabase = await createClient();
  const [{ rows, byBranch }, { data: courses }] = await Promise.all([
    loadSettlement(month, paidOnly, course),
    supabase.from("courses").select("id, title").order("sort_order"),
  ]);
  const total = byBranch.reduce((s, [, b]) => s + b.total, 0);
  const qs = new URLSearchParams({ month, paid: paidOnly ? "1" : "0", ...(course ? { course } : {}) }).toString();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">수강자 정산</h1>
        <a href={`/admin/settlement/export?${qs}`} className="btn-primary btn-sm">엑셀로 내려받기</a>
      </div>
      <p className="mt-1 text-sub text-[15px]">
        한 달 동안 수강한 사람(수강 확정·수료)을 지점별로 모아요. 재무팀 비용 공제용이에요. 기준일은 회차 시작일이고, 시작일이 없는 회차는 신청일로 셈해요.
      </p>

      <form className="mt-5 grid gap-2 sm:grid-cols-[160px_1fr_auto_auto] items-center">
        <input type="month" name="month" defaultValue={month} className="input h-11" aria-label="월" />
        <select name="course" defaultValue={course ?? ""} className="input h-11" aria-label="강좌">
          <option value="">모든 강좌</option>
          {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select name="paid" defaultValue={paidOnly ? "1" : "0"} className="input h-11" aria-label="범위">
          <option value="1">유료 강좌만</option>
          <option value="0">무료 포함 전체</option>
        </select>
        <button className="btn-primary h-11">보기</button>
      </form>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="rounded-2xl bg-surface p-4"><p className="text-[13px] text-sub">수강 건수</p><p className="text-[22px] font-extrabold">{rows.length.toLocaleString("ko-KR")}건</p></div>
        <div className="rounded-2xl bg-surface p-4"><p className="text-[13px] text-sub">수강료 합계</p><p className="text-[22px] font-extrabold">{total.toLocaleString("ko-KR")}원</p></div>
        <div className="rounded-2xl bg-surface p-4 col-span-2 sm:col-span-1"><p className="text-[13px] text-sub">지점 수</p><p className="text-[22px] font-extrabold">{byBranch.length}곳</p></div>
      </div>

      <h2 className="mt-8 mb-2 font-bold">지점별</h2>
      {byBranch.length === 0 ? (
        <p className="rounded-2xl bg-surface py-10 text-center text-sub">이 달에 수강한 사람이 없어요.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="text-left text-sub border-b border-line">
              <tr><th className="py-2 font-medium">지점·살롱</th><th className="py-2 font-medium text-right">인원</th><th className="py-2 font-medium text-right">수강료 합계</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {byBranch.map(([b, v]) => (
                <tr key={b}>
                  <td className="py-2.5">{b}</td>
                  <td className="py-2.5 text-right">{v.count}</td>
                  <td className="py-2.5 text-right">{v.total.toLocaleString("ko-KR")}원{v.unknown ? <span className="text-orange"> · 가격 미정 {v.unknown}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <h2 className="mt-8 mb-2 font-bold">명단</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[14px]">
              <thead className="text-left text-sub border-b border-line">
                <tr>
                  <th className="py-2 font-medium">지점</th><th className="py-2 font-medium">이름</th><th className="py-2 font-medium">강좌 · 회차</th>
                  <th className="py-2 font-medium">수업일</th><th className="py-2 font-medium text-right">수강료</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5">{r.branch}</td>
                    <td className="py-2.5">{r.name} <span className="text-muted">{r.title}</span></td>
                    <td className="py-2.5">{r.course}<span className="text-muted"> · {r.session}</span></td>
                    <td className="py-2.5">{r.date}{!r.dateIsClass && <span className="text-muted"> (신청일)</span>}</td>
                    <td className="py-2.5 text-right">{formatPrice(r.price)}{r.priceNote ? <span className="block text-[12px] text-muted">{r.priceNote}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
