import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { removeStaff } from "../actions";
import { AddStaffForm } from "./add-form";

export const metadata: Metadata = { title: "운영진" };

export default async function AdminStaff() {
  const viewer = await getViewer();
  const supabase = await createClient();
  const { data: admins } = await supabase.from("admins").select("user_id, created_at").order("created_at");
  const ids = (admins ?? []).map((a) => a.user_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, name, email").in("id", ids)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">운영진</h1>
      <p className="mt-1 text-sub text-[15px]">
        운영진은 관리자 화면 전체를 쓸 수 있어요. 신청 확정, 강좌·회차 수정, 강사 심사, 회원 조회가 가능해요.
      </p>

      <section className="mt-8 panel p-5">
        <h2 className="font-bold">직원에게 관리자 권한 주기</h2>
        <p className="mt-1 mb-4 text-[14px] text-sub">직원이 먼저 사이트에서 회원가입을 하면, 가입한 이메일로 권한을 줄 수 있어요.</p>
        <AddStaffForm />
      </section>

      <section className="mt-8">
        <h2 className="text-[18px] font-bold mb-3">현재 운영진 {ids.length}명</h2>
        <ul className="divide-y divide-line border-y border-line">
          {(admins ?? []).map((a) => {
            const p = byId.get(a.user_id);
            const me = a.user_id === viewer?.userId;
            return (
              <li key={a.user_id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold">{p?.name ?? "이름 없음"}{me && <span className="ml-2 chip-blue">나</span>}</p>
                  <p className="text-[13px] text-sub truncate">{p?.email}</p>
                </div>
                {!me && (
                  <form action={removeStaff}>
                    <input type="hidden" name="user_id" value={a.user_id} />
                    <button className="btn-gray btn-sm">권한 해제</button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
