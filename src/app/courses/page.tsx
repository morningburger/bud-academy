import Link from "next/link";
import type { Metadata } from "next";
import { listPublicCourses } from "@/lib/queries";
import { CourseCard } from "@/components/course-card";
import { TRACK_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "강좌" };

const TRACKS = ["level", "trend", "guest", "brand", "leadership"] as const;

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { track } = await searchParams;
  const active = typeof track === "string" && track in TRACK_LABEL ? track : undefined;
  const all = await listPublicCourses(active);
  const courses = all.filter((c) => c.status === "published");
  const past = all.filter((c) => c.status === "closed");

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-10">
      <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">강좌</h1>
      <div className="mt-5 mb-8 flex gap-2 overflow-x-auto pb-1">
        <Link href="/courses" className={`${!active ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}>전체</Link>
        {TRACKS.map((key) => (
          <Link key={key} href={`/courses?track=${key}`} className={`${active === key ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}>
            {TRACK_LABEL[key]}
          </Link>
        ))}
      </div>
      {courses.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sub">지금 모집 중인 강좌가 없어요.</div>
      ) : (
        <div className="grid gap-x-5 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}

      <Link href="/suggest" className="mt-14 flex items-center justify-between gap-4 rounded-2xl bg-blue-weak px-5 py-5 hover:brightness-[0.98]">
        <span>
          <span className="block font-bold text-ink">찾는 교육이 없나요?</span>
          <span className="block text-[14px] text-sub mt-0.5">듣고 싶은 교육이나 모시고 싶은 강사를 알려 주세요</span>
        </span>
        <span className="btn-primary btn-sm shrink-0">건의하기</span>
      </Link>

      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="text-[20px] font-bold">지난 교육</h2>
          <p className="mt-1 mb-6 text-[14px] text-sub">모집이 끝난 교육이에요. 다시 열리면 이곳에서 신청할 수 있어요.</p>
          <div className="grid gap-x-5 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 opacity-80">
            {past.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
