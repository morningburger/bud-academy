import Link from "next/link";
import type { CourseWithInstructor } from "@/lib/types";
import { TRACK_LABEL, formatPrice } from "@/lib/format";

const TINT: Record<string, string> = {
  level: "from-[#e8f3ff] to-[#d3e6ff] text-[#1b64da]",
  guest: "from-[#f3edff] to-[#e2d6ff] text-[#6b3fd6]",
  brand: "from-[#fff3e0] to-[#ffe2b8] text-[#c46f00]",
  leadership: "from-[#fdeee8] to-[#f6d6c8] text-[#b2492a]",
  trend: "from-[#e5f8f0] to-[#c9efdd] text-[#028a54]",
  etc: "from-[#f2f4f6] to-[#e5e8eb] text-[#4e5968]",
};

export function CourseThumb({ course, className = "", contain = false }: { course: CourseWithInstructor; className?: string; contain?: boolean }) {
  if (course.thumbnail_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={course.thumbnail_url} alt="" className={`${contain ? "object-contain" : "object-cover"} bg-surface ${className}`} />;
  }
  return (
    <div className={`bg-gradient-to-br ${TINT[course.track] ?? TINT.etc} flex items-end p-4 ${className}`}>
      <span className="text-[22px] font-extrabold tracking-[-0.04em] leading-none opacity-90">{TRACK_LABEL[course.track]}</span>
    </div>
  );
}

export function sellerLine(course: CourseWithInstructor) {
  const names = (course.lineup ?? []).map((l) => l.instructor?.name).filter(Boolean) as string[];
  if (names.length) return names.length > 2 ? `${names.slice(0, 2).join(" · ")} 외 ${names.length - 2}명` : names.join(" · ");
  if (course.is_official) return "버드아카데미";
  return course.instructor?.name ?? "";
}

export function CourseCard({ course }: { course: CourseWithInstructor }) {
  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <div className="relative">
        <CourseThumb course={course} className="aspect-[16/10] w-full rounded-2xl" />
        {course.level && (
          <span className="absolute left-3 top-3 rounded-lg bg-ink/85 px-2 py-1 text-[12px] font-bold text-white">LV{course.level}</span>
        )}
      </div>
      <div className="pt-3">
        <p className="text-[13px] font-semibold text-blue">{TRACK_LABEL[course.track]}</p>
        <h3 className="mt-0.5 text-[17px] font-bold leading-snug text-ink group-hover:text-blue transition-colors">{course.title}</h3>
        <p className="mt-1 text-[14px] text-sub truncate">{sellerLine(course)}</p>
        {course.schedule_summary && <p className="mt-0.5 text-[13px] text-muted truncate">{course.schedule_summary}</p>}
        <p className="mt-1.5 text-[16px] font-bold text-ink">
          {formatPrice(course.price)}
          {course.status === "closed" && <span className="ml-1.5 chip-gray align-middle">모집 마감</span>}
        </p>
      </div>
    </Link>
  );
}
