import Link from "next/link";
import type { CourseWithInstructor, OrgType } from "@/lib/types";
import { TRACK_LABEL, coursePrice, isRecruiting } from "@/lib/format";

export type PriceViewer = { orgType: OrgType | null; isAdmin?: boolean } | null;

const TINT: Record<string, string> = {
  level: "from-[#e8f3ff] to-[#d3e6ff] text-[#1b64da]",
  guest: "from-[#f3edff] to-[#e2d6ff] text-[#6b3fd6]",
  brand: "from-[#fff3e0] to-[#ffe2b8] text-[#c46f00]",
  leadership: "from-[#fdeee8] to-[#f6d6c8] text-[#b2492a]",
  trend: "from-[#e5f8f0] to-[#c9efdd] text-[#028a54]",
  special: "from-[#eef4ff] to-[#dbe7ff] text-[#3a5bd6]",
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

/** 신청 대상 배지: 사내 교육 / 누구나 */
export function AudienceBadge({ internalOnly }: { internalOnly: boolean }) {
  return internalOnly
    ? <span className="chip-gray">고정현헤어 전용</span>
    : <span className="chip-green">누구나 신청</span>;
}

export function CourseCard({ course, viewer = null }: { course: CourseWithInstructor; viewer?: PriceViewer }) {
  const price = coursePrice(course, viewer);
  const recruiting = isRecruiting(course, course.sessions);
  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <div className="relative">
        <CourseThumb course={course} className="aspect-[16/10] w-full rounded-2xl" />
        {course.level && (
          <span className="absolute left-3 top-3 rounded-lg bg-ink/85 px-2 py-1 text-[12px] font-bold text-white">LV{course.level}</span>
        )}
        {recruiting && (
          <span className="absolute right-3 top-3 rounded-lg bg-blue px-2 py-1 text-[12px] font-bold text-white">모집 중</span>
        )}
      </div>
      <div className="pt-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-blue">{TRACK_LABEL[course.track]}</p>
          <AudienceBadge internalOnly={course.internal_only} />
        </div>
        <h3 className="mt-1 text-[17px] font-bold leading-snug text-ink group-hover:text-blue transition-colors">{course.title}</h3>
        <p className="mt-1 text-[14px] text-sub truncate">{sellerLine(course)}</p>
        {course.schedule_summary && <p className="mt-0.5 text-[13px] text-muted truncate">{course.schedule_summary}</p>}
        {course.status === "closed" ? (
          <p className="mt-2"><span className="chip-gray">지난 교육</span></p>
        ) : (
          <>
            <p className={`mt-1.5 text-[16px] font-bold ${price.hidden ? "text-sub" : "text-ink"}`}>{price.main}</p>
            {price.detail && <p className="text-[12px] text-muted truncate">{price.detail}</p>}
          </>
        )}
      </div>
    </Link>
  );
}
