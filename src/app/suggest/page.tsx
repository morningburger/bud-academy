import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SUGGESTION_CATEGORY, SUGGESTION_STATUS, formatDateTime } from "@/lib/format";
import { SuggestForm } from "./form";

export const metadata: Metadata = { title: "교육 건의" };

export default async function SuggestPage() {
  const viewer = await requireViewer("/suggest");
  const supabase = await createClient();
  const { data } = await supabase
    .from("suggestions")
    .select("id, category, body, status, created_at")
    .eq("user_id", viewer.userId)
    .order("created_at", { ascending: false })
    .limit(20);
  const mine = data ?? [];
  return (
    <div className="mx-auto max-w-[560px] px-4 pt-10">
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">교육 건의</h1>
      <p className="mt-2 mb-8 text-[15px] text-sub">듣고 싶은 교육, 모시고 싶은 강사, 불편했던 점을 알려 주세요. 다음 교육을 기획할 때 참고해요.</p>
      <SuggestForm />
      {mine.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-[17px] font-bold">내가 보낸 건의</h2>
          <ul className="flex flex-col gap-2">
            {mine.map((s) => (
              <li key={s.id} className="rounded-2xl bg-surface p-4">
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="font-semibold text-sub">{SUGGESTION_CATEGORY[s.category]}</span>
                  <span className={s.status === "new" ? "text-muted" : "text-blue font-semibold"}>{SUGGESTION_STATUS[s.status]}</span>
                </div>
                <p className="mt-1 text-[15px] text-ink-2 whitespace-pre-line break-words">{s.body}</p>
                <p className="mt-1 text-[12px] text-muted">{formatDateTime(s.created_at)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
