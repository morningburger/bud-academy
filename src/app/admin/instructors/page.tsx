import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InstructorStatusChip } from "@/components/status-chip";
import { Avatar } from "@/components/avatar";
import { AddInstructorForm } from "../admin-forms";
import { ReviewForm } from "../review-form";
import type { Instructor, InstructorStatus } from "@/lib/types";

export const metadata: Metadata = { title: "강사" };

const ORDER: InstructorStatus[] = ["pending", "approved", "rejected", "suspended"];

export default async function AdminInstructors() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select("*, settings:instructor_settings(commission_rate, review_note), lineup:course_instructors(course_id)")
    .order("created_at", { ascending: true });
  const list = ((data ?? []) as (Instructor & { settings: { commission_rate: number; review_note: string | null } | null; lineup: unknown[] })[])
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));
  const pending = list.filter((i) => i.status === "pending");
  const rest = list.filter((i) => i.status !== "pending");

  return (
    <div>
      <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">강사</h1>
      <p className="mt-1 text-sub text-[15px]">입점 신청을 심사하고, 소속 디자이너를 직접 등록하거나 프로필 사진·소개를 고칠 수 있어요.</p>

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[18px] font-bold mb-3">심사 대기 {pending.length}명</h2>
          <ul className="flex flex-col gap-3">
            {pending.map((i) => <ReviewCard key={i.id} i={i} />)}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[18px] font-bold mb-3">전체 강사 {rest.length}명</h2>
        <ul className="divide-y divide-line border-y border-line">
          {rest.map((i) => (
            <li key={i.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={i.name} url={i.photo_url} size={44} />
                <div className="min-w-0">
                  <p className="font-bold flex items-center gap-2">
                    {i.name} <InstructorStatusChip s={i.status} />
                  </p>
                  <p className="text-[13px] text-sub truncate">
                    {[i.affiliation === "gohair" ? `고정현헤어${i.branch_name ? ` ${i.branch_name}` : ""}` : i.branch_name ?? "외부", i.headline, i.user_id ? null : "계정 미연결", `강좌 ${i.lineup.length}개`].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Link href={`/admin/instructors/${i.id}`} className="btn-gray btn-sm">프로필·권한</Link>
                <Link href={`/instructors/${i.id}`} className="btn-gray btn-sm" target="_blank">공개 페이지</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="add" className="mt-10 panel p-5 scroll-mt-20">
        <h2 className="font-bold">강사 직접 등록</h2>
        <p className="text-[14px] text-sub mt-1 mb-4">소속 디자이너나 초청 강사를 계정 없이 등록해요. 등록 후 &lsquo;프로필·권한&rsquo;에서 사진과 소개를 넣을 수 있어요.</p>
        <AddInstructorForm />
      </section>
    </div>
  );
}

function ReviewCard({ i }: { i: Instructor & { settings: { commission_rate: number; review_note: string | null } | null } }) {
  return (
    <li className="panel p-5">
      <div className="flex items-start gap-4">
        <Avatar name={i.name} url={i.photo_url} size={48} />
        <div className="min-w-0 flex-1">
          <p className="font-bold flex items-center gap-2">{i.name} <InstructorStatusChip s={i.status} /></p>
          <p className="text-[14px] text-sub">{[i.branch_name, i.headline].filter(Boolean).join(" · ")}</p>
          {i.career && <p className="text-[14px] text-ink-2 mt-2 whitespace-pre-line">{i.career}</p>}
          {i.bio && <p className="text-[14px] text-ink-2 mt-2 whitespace-pre-line">{i.bio}</p>}
          {i.instagram && <p className="text-[13px] text-muted mt-1">@{i.instagram}</p>}
        </div>
      </div>
      <ReviewForm i={i} />
    </li>
  );
}
