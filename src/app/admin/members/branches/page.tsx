import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MemberTabs } from "../tabs";
import { addBranch, toggleBranch } from "../actions";

export const metadata: Metadata = { title: "지점 목록" };

export default async function BranchesPage() {
  const supabase = await createClient();
  const [{ data }, { data: counts }] = await Promise.all([
    supabase.from("branches").select("*").order("sort_order").order("name"),
    supabase.from("profiles").select("branch").eq("org_type", "gohair"),
  ]);
  const branches = (data ?? []) as { name: string; active: boolean }[];
  const countMap = new Map<string, number>();
  (counts ?? []).forEach((p) => p.branch && countMap.set(p.branch, (countMap.get(p.branch) ?? 0) + 1));

  return (
    <div>
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">회원</h1>
      <p className="mt-1 text-sub text-[15px]">가입할 때 고르는 고정현헤어 지점 목록이에요. 문을 닫은 지점은 &lsquo;숨기기&rsquo;를 누르면 목록에서 빠져요.</p>
      <MemberTabs active="/admin/members/branches" />
      <form action={addBranch} className="mt-4 flex gap-2">
        <input name="name" className="input h-11" placeholder="새 지점 이름 (예: 송도2호점)" required maxLength={40} />
        <button className="btn-primary h-11 shrink-0">추가</button>
      </form>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {branches.map((b) => (
          <li key={b.name} className="py-3 flex items-center justify-between gap-3">
            <p className={b.active ? "font-semibold" : "text-muted line-through"}>
              {b.name} <span className="text-[13px] font-normal text-muted no-underline">회원 {countMap.get(b.name) ?? 0}명</span>
            </p>
            <form action={toggleBranch}>
              <input type="hidden" name="name" value={b.name} />
              <input type="hidden" name="active" value={String(!b.active)} />
              <button className="btn-gray btn-sm">{b.active ? "숨기기" : "다시 보이기"}</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
