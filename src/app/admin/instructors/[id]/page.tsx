import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "../../review-form";
import { AdminInstructorForm } from "./form";
import { LinkAccountForm } from "./link-account";
import type { Instructor } from "@/lib/types";

export default async function AdminInstructorEdit({ params }: PageProps<"/admin/instructors/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase
    .from("instructors")
    .select("*, settings:instructor_settings(commission_rate, review_note), lineup:course_instructors(role, course:courses(id, title))")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const { data: linked } = data.user_id
    ? await supabase.from("profiles").select("email").eq("id", data.user_id).maybeSingle()
    : { data: null };
  const i = data as Instructor & {
    settings: { commission_rate: number; review_note: string | null } | null;
    lineup: { role: string | null; course: { id: string; title: string } | null }[];
  };

  return (
    <div className="max-w-[640px]">
      <Link href="/admin/instructors" className="text-[14px] text-sub hover:text-ink">‹ 강사</Link>
      <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.04em]">{i.name}</h1>
      <p className="text-sub text-[15px]">{i.user_id ? "본인 계정과 연결된 강사예요. 본인도 강사 스튜디오에서 프로필을 고칠 수 있어요." : "계정 없이 관리자가 등록한 강사예요."}</p>

      <section className="mt-8">
        <h2 className="text-[18px] font-bold mb-1">회원 계정 연결</h2>
        <p className="mb-3 text-[14px] text-sub">강사가 가입한 계정을 연결하면 강사 스튜디오에서 맡은 강좌의 출석을 부를 수 있어요.</p>
        <LinkAccountForm id={i.id} linkedEmail={i.user_id ? (linked?.email ?? "") : null} />
      </section>

      <section className="mt-8">
        <h2 className="text-[18px] font-bold mb-2">상태·소속·수수료</h2>
        <ReviewForm i={i} />
      </section>

      {i.lineup.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[18px] font-bold mb-2">맡은 강좌</h2>
          <ul className="flex flex-col gap-1.5">
            {i.lineup.map((l) => l.course && (
              <li key={l.course.id}>
                <Link href={`/manage/courses/${l.course.id}?tab=lineup`} className="flex justify-between rounded-xl bg-surface px-4 py-3 hover:bg-surface-strong">
                  <span className="font-semibold">{l.course.title}</span>
                  <span className="text-[14px] text-sub">{l.role}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[18px] font-bold mb-4">공개 프로필</h2>
        <AdminInstructorForm instructor={i} />
      </section>
    </div>
  );
}
