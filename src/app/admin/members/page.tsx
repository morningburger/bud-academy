import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { affiliationLine, formatDateTime } from "@/lib/format";
import { listBranches } from "@/lib/queries";
import type { OrgType } from "@/lib/types";
import { MemberTabs } from "./tabs";

export const metadata: Metadata = { title: "회원" };

type Member = {
  id: string; name: string | null; email: string | null; phone: string | null; created_at: string;
  org_type: OrgType | null; branch: string | null; job_title: string | null; marketing_agreed: boolean; legacy_joined_on: string | null;
};

export default async function AdminMembers({ searchParams }: PageProps<"/admin/members">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().replace(/[%,().*"\\]/g, "") : "";
  const branch = typeof sp.branch === "string" ? sp.branch : "";
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, name, email, phone, created_at, org_type, branch, job_title, marketing_agreed, legacy_joined_on", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);
  if (branch === "__external") query = query.eq("org_type", "external");
  else if (branch === "__none") query = query.is("org_type", null);
  else if (branch) query = query.eq("branch", branch);
  if (q) {
    const digits = q.replace(/[^0-9]/g, "");
    query = q.includes("@") ? query.ilike("email", `%${q}%`) : digits.length >= 4 ? query.ilike("phone", `%${digits}%`) : query.or(`name.ilike.%${q}%,branch.ilike.%${q}%`);
  }
  const [{ data, count }, branches] = await Promise.all([query, listBranches()]);
  const members = (data ?? []) as Member[];
  const ids = members.map((m) => m.id);

  const [{ data: admins }, { data: instructors }, { data: enrolls }] = ids.length
    ? await Promise.all([
        supabase.from("admins").select("user_id").in("user_id", ids),
        supabase.from("instructors").select("user_id, status").in("user_id", ids),
        supabase.from("enrollments").select("user_id, status").in("user_id", ids),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const adminSet = new Set((admins ?? []).map((a) => a.user_id));
  const insMap = new Map((instructors ?? []).map((i) => [i.user_id, i.status]));
  const countMap = new Map<string, number>();
  (enrolls ?? []).forEach((e) => e.status !== "canceled" && countMap.set(e.user_id, (countMap.get(e.user_id) ?? 0) + 1));

  return (
    <div>
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">회원</h1>
      <p className="mt-1 text-sub text-[15px]">이름, 지점, 이메일, 휴대폰 번호로 찾을 수 있어요.</p>
      <MemberTabs active="/admin/members" />
      <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <select name="branch" defaultValue={branch} className="input h-11" aria-label="소속">
          <option value="">모든 소속</option>
          {branches.map((b) => <option key={b} value={b}>{b}</option>)}
          <option value="__external">다른 살롱</option>
          <option value="__none">소속 미입력</option>
        </select>
        <input name="q" defaultValue={q} className="input h-11" placeholder="이름, 지점, 이메일, 휴대폰" aria-label="회원 검색" />
        <button className="btn-primary h-11 shrink-0">찾기</button>
      </form>
      <p className="mt-5 mb-2 text-[14px] text-sub">{(count ?? 0).toLocaleString("ko-KR")}명{(count ?? 0) > 200 ? " 중 최근 200명" : ""}</p>
      <ul className="divide-y divide-line border-y border-line">
        {members.length === 0 && <li className="py-10 text-center text-sub">찾는 회원이 없어요.</li>}
        {members.map((m) => (
          <li key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold flex flex-wrap items-center gap-1.5">
                {m.name ?? "이름 없음"}
                {m.job_title && <span className="font-normal text-sub">{m.job_title}</span>}
                {adminSet.has(m.id) && <span className="chip bg-ink text-white">운영진</span>}
                {insMap.has(m.id) && <span className="chip-green">강사{insMap.get(m.id) !== "approved" ? " 심사 중" : ""}</span>}
                {m.legacy_joined_on && <span className="chip-gray">기존 회원</span>}
                {!m.org_type && <span className="chip-orange">소속 미입력</span>}
              </p>
              <p className="text-[14px] text-ink-2">{affiliationLine(m.org_type, m.branch, null) ?? ""}</p>
              <p className="text-[13px] text-sub truncate">
                {[m.email, m.phone?.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3"), m.marketing_agreed ? "마케팅 수신 동의" : null].filter(Boolean).join(" · ")}
              </p>
            </div>
            <p className="text-[13px] text-muted text-right">
              수강 신청 {countMap.get(m.id) ?? 0}건
              <br />
              {formatDateTime(m.created_at)} 가입
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
