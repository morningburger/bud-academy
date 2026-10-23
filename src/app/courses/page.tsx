import Link from "next/link";
import type { Metadata } from "next";
import { listPublicCourses } from "@/lib/queries";
import { CourseCard } from "@/components/course-card";
import { CATEGORY_LABEL } from "@/lib/format";

export const metadata: Metadata = { title: "강좌" };

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { category } = await searchParams;
  const active = typeof category === "string" && category in CATEGORY_LABEL ? category : undefined;
  const courses = await listPublicCourses(active);

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-10">
      <h1 className="text-[28px] font-extrabold tracking-[-0.04em]">강좌</h1>
      <div className="mt-5 mb-8 flex gap-2 overflow-x-auto pb-1">
        <Link href="/courses" className={`${!active ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}>전체</Link>
        {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
          <Link
            key={key}
            href={`/courses?category=${key}`}
            className={`${active === key ? "btn-primary" : "btn-gray"} btn-sm whitespace-nowrap`}
          >
            {label}
          </Link>
        ))}
      </div>
      {courses.length === 0 ? (
        <div className="rounded-2xl bg-surface py-16 text-center text-sub">
          이 분야에 열린 강좌가 아직 없어요.
        </div>
      ) : (
        <div className="grid gap-x-5 gap-y-9 grid-cols-2 lg:grid-cols-4">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  );
}
