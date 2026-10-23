import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SUGGESTION_CATEGORY, SUGGESTION_STATUS, affiliationLine, formatDateTime } from "@/lib/format";
import type { OrgType } from "@/lib/types";
import { updateSuggestion } from "./actions";

export const metadata: Metadata = { title: "교육 건의" };

const FILTERS = [["new", "새 건의"], ["read", "확인함"], ["done", "완료"], ["all", "전체"]];

export default async function AdminSuggestions({ searchParams }: PageProps<"/admin/suggestions">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && FILTERS.some(([v]) => v === sp.status) ? sp.status : "new";
  const supabase = await createClient();
  let q = supabase.from("suggestions").select("*").order("created_at", { ascending: false }).limit(300);
  if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as { id: string; user_id: string; category: string; body: string; status: string; admin_note: string | null; created_at: string }[];
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, name, org_type, branch, job_title, phone").in("id", ids)
    : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id, p as { name: string | null; org_type: OrgType | null; branch: string | null; job_title: string | null; phone: string | null }]));

  return (
    <div>
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">교육 건의</h1>
      <p className="mt-1 text-sub text-[15px]">회원이 <Link href="/suggest" className="underline" target="_blank">교육 건의</Link>에 남긴 의견이에요. 다음 교육 기획에 참고하세요.</p>
      <div className="mt-5 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(([v, l]) => (
          <Link key={v} href={`?status=${v}`} className={`${status === v ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}>{l}</Link>
        ))}
      </div>
      <ul className="mt-5 flex flex-col gap-3">
        {rows.length === 0 && <li className="rounded-2xl bg-surface py-12 text-center text-sub">건의가 없어요.</li>}
        {rows.map((r) => {
          const p = who.get(r.user_id);
          return (
            <li key={r.id} className="panel p-5">
              <div className="flex flex-wrap items-center gap-2 text-[13px]">
                <span className="chip-blue">{SUGGESTION_CATEGORY[r.category]}</span>
                <span className={r.status === "new" ? "chip-orange" : "chip-gray"}>{SUGGESTION_STATUS[r.status]}</span>
                <span className="text-muted">{formatDateTime(r.created_at)}</span>
              </div>
              <p className="mt-2 text-[16px] text-ink whitespace-pre-line break-words">{r.body}</p>
              <p className="mt-2 text-[14px] text-sub">
                {[p?.name, affiliationLine(p?.org_type, p?.branch, p?.job_title), p?.phone?.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")].filter(Boolean).join(" · ")}
              </p>
              <form action={updateSuggestion} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input name="admin_note" defaultValue={r.admin_note ?? ""} className="input h-10 flex-1 min-w-[200px]" placeholder="운영진 메모 (회원에게는 안 보여요)" />
                <button name="status" value={r.status === "new" ? "read" : r.status} className="btn-gray btn-sm h-10">{r.status === "new" ? "확인함" : "메모 저장"}</button>
                {r.status !== "done" && <button name="status" value="done" className="btn-weak btn-sm h-10">완료</button>}
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
