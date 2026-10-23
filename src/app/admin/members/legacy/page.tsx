import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { affiliationLine } from "@/lib/format";
import type { OrgType } from "@/lib/types";
import { MemberTabs } from "../tabs";

export const metadata: Metadata = { title: "기존 사이트 명단" };

type Legacy = {
  email: string; raw_name: string | null; name: string | null; phone: string | null; org_type: OrgType | null; branch: string | null;
  job_title: string | null; enrolled: boolean | null; joined_on: string | null; claimed_by: string | null;
};

export default async function LegacyMembers({ searchParams }: PageProps<"/admin/members/legacy">) {
  const sp = await searchParams;
  const show = sp.show === "joined" ? "joined" : sp.show === "all" ? "all" : "waiting";
  const q = typeof sp.q === "string" ? sp.q.trim().replace(/[%,().*"\\]/g, "") : "";
  const supabase = await createClient();
  let query = supabase.from("legacy_members").select("*", { count: "exact" }).order("joined_on", { ascending: false, nullsFirst: false }).limit(300);
  if (show === "waiting") query = query.is("claimed_by", null);
  if (show === "joined") query = query.not("claimed_by", "is", null);
  if (q) query = q.includes("@") ? query.ilike("email", `%${q}%`) : query.or(`raw_name.ilike.%${q}%,branch.ilike.%${q}%`);
  const [{ data, count }, { count: total }, { count: joined }] = await Promise.all([
    query,
    supabase.from("legacy_members").select("email", { count: "exact", head: true }),
    supabase.from("legacy_members").select("email", { count: "exact", head: true }).not("claimed_by", "is", null),
  ]);
  const rows = (data ?? []) as Legacy[];
  const qs = (v: string) => `?show=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">회원</h1>
        <Link href="/admin/members/import" className="btn-primary btn-sm">엑셀로 명단 가져오기</Link>
      </div>
      <p className="mt-1 text-sub text-[15px]">
        기존 사이트 회원 {(total ?? 0).toLocaleString("ko-KR")}명 중 {(joined ?? 0).toLocaleString("ko-KR")}명이 새 사이트에 가입했어요.
      </p>
      <MemberTabs active="/admin/members/legacy" />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[["waiting", "아직 가입 안 함"], ["joined", "가입 완료"], ["all", "전체"]].map(([v, l]) => (
          <Link key={v} href={qs(v)} className={`${show === v ? "bg-ink text-white" : "bg-surface text-sub"} rounded-full px-3.5 h-8 text-[14px] font-semibold grid place-items-center`}>{l}</Link>
        ))}
      </div>
      <form className="mt-3 flex gap-2">
        <input type="hidden" name="show" value={show} />
        <input name="q" defaultValue={q} className="input h-11" placeholder="이름, 지점, 이메일" aria-label="검색" />
        <button className="btn-primary h-11 shrink-0">찾기</button>
      </form>
      {(total ?? 0) === 0 ? (
        <div className="mt-6 rounded-2xl bg-surface py-12 px-6 text-center text-sub">
          아직 가져온 명단이 없어요.
          <br />
          <Link href="/admin/members/import" className="text-blue font-semibold">기존 사이트 회원 엑셀 올리기</Link>
        </div>
      ) : (
        <>
          <p className="mt-5 mb-2 text-[14px] text-sub">{(count ?? 0).toLocaleString("ko-KR")}명</p>
          <ul className="divide-y divide-line border-y border-line">
            {rows.map((m) => (
              <li key={m.email} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold flex flex-wrap items-center gap-1.5">
                    {m.name ?? m.raw_name ?? "이름 없음"}
                    {m.job_title && <span className="font-normal text-sub">{m.job_title}</span>}
                    {m.claimed_by ? <span className="chip-blue">가입 완료</span> : <span className="chip-gray">미가입</span>}
                    {!m.org_type && m.branch && <span className="chip-orange">지점 확인 필요</span>}
                  </p>
                  <p className="text-[14px] text-ink-2">{affiliationLine(m.org_type, m.branch, null) ?? m.branch ?? ""}</p>
                  <p className="text-[13px] text-sub truncate">{[m.email, m.phone?.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="text-[13px] text-muted text-right">
                  {m.enrolled === null ? "" : m.enrolled ? "수강 이력 있음" : "수강 이력 없음"}
                  <br />
                  {m.joined_on ? `${m.joined_on} 가입` : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
