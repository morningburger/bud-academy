import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "회원" };

export default async function AdminMembers({ searchParams }: PageProps<"/admin/members">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().replace(/[%,()]/g, "") : "";
  const supabase = await createClient();
  let query = supabase.from("profiles").select("id, name, email, phone, created_at").order("created_at", { ascending: false }).limit(100);
  if (q) {
    const digits = q.replace(/[^0-9]/g, "");
    query = q.includes("@") ? query.ilike("email", `%${q}%`) : digits.length >= 4 ? query.ilike("phone", `%${digits}%`) : query.ilike("name", `%${q}%`);
  }
  const { data } = await query;
  const members = (data ?? []) as { id: string; name: string | null; email: string | null; phone: string | null; created_at: string }[];
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
      <p className="mt-1 text-sub text-[15px]">이름, 이메일, 휴대폰 번호로 찾을 수 있어요. 최근 가입 순으로 100명까지 보여요.</p>
      <form className="mt-5 flex gap-2">
        <input name="q" defaultValue={q} className="input h-11" placeholder="이름, 이메일, 휴대폰" aria-label="회원 검색" />
        <button className="btn-primary h-11 shrink-0">찾기</button>
      </form>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {members.length === 0 && <li className="py-10 text-center text-sub">찾는 회원이 없어요.</li>}
        {members.map((m) => (
          <li key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold flex flex-wrap items-center gap-1.5">
                {m.name ?? "이름 없음"}
                {adminSet.has(m.id) && <span className="chip bg-ink text-white">운영진</span>}
                {insMap.has(m.id) && <span className="chip-green">강사{insMap.get(m.id) !== "approved" ? " 심사 중" : ""}</span>}
              </p>
              <p className="text-[13px] text-sub truncate">
                {[m.email, m.phone?.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")].filter(Boolean).join(" · ")}
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
