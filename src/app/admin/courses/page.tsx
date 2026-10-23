import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CourseStatusChip } from "@/components/status-chip";
import { TRACK_LABEL, formatPrice } from "@/lib/format";
import type { Course, CourseStatus } from "@/lib/types";

export const metadata: Metadata = { title: "강좌·회차" };

const ORDER: CourseStatus[] = ["pending_review", "published", "closed", "draft", "rejected"];

export default async function AdminCourses() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("*, instructor:instructors!courses_instructor_id_fkey(name), sessions:course_sessions(status), enrollments(status)")
    .order("sort_order");
  const courses = (data ?? []) as (Course & {
    instructor: { name: string } | null;
    sessions: { status: string }[];
    enrollments: { status: string }[];
  })[];
  const sorted = [...courses].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.sort_order - b.sort_order);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.04em]">강좌·회차</h1>
        <Link href="/manage/courses/new?official=1" className="btn-primary btn-sm">새 강좌 만들기</Link>
      </div>
      <p className="mt-1 text-sub text-[15px]">강좌를 누르면 신청자, 회차, 강사진, 소개 내용을 고칠 수 있어요. 다음 달 반은 &lsquo;회차&rsquo;에서 추가하세요.</p>

      <ul className="mt-6 flex flex-col gap-2">
        {sorted.map((c) => {
          const open = c.sessions.filter((s) => s.status === "open").length;
          const waiting = c.enrollments.filter((e) => e.status === "requested").length;
          const confirmed = c.enrollments.filter((e) => e.status === "approved").length;
          return (
            <li key={c.id}>
              <Link href={`/manage/courses/${c.id}`} className="panel flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 hover:bg-[#fafbfc]">
                <div className="flex items-center gap-4 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {c.thumbnail_url ? <img src={c.thumbnail_url} alt="" className="hidden sm:block size-14 rounded-xl object-cover bg-surface shrink-0" /> : null}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CourseStatusChip s={c.status} />
                      <span className="text-[13px] text-muted">{TRACK_LABEL[c.track]}{c.is_official ? " · 직영" : c.instructor ? ` · ${c.instructor.name}` : ""}</span>
                    </div>
                    <p className="mt-1 font-bold truncate">{c.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[14px]">
                  <span className={open ? "text-ink" : "text-muted"}>모집 중 회차 {open}</span>
                  {waiting > 0 && <span className="font-bold text-orange">새 신청 {waiting}</span>}
                  <span className="text-sub">확정 {confirmed}</span>
                  <span className="text-sub w-20 text-right">{formatPrice(c.price)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
