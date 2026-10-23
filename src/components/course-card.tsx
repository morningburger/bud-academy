import Link from "next/link";
import type { CourseWithInstructor } from "@/lib/types";
import { CATEGORY_LABEL, FORMAT_LABEL, formatPrice } from "@/lib/format";
import { SellerBadge, sellerName } from "./badges";

const TINT: Record<string, string> = {
  designer: "from-[#e8f3ff] to-[#d3e6ff] text-[#1b64da]",
  perm: "from-[#fff3e0] to-[#ffe2b8] text-[#c46f00]",
  trend: "from-[#f3edff] to-[#e2d6ff] text-[#6b3fd6]",
  special: "from-[#e5f8f0] to-[#c9efdd] text-[#028a54]",
  etc: "from-[#f2f4f6] to-[#e5e8eb] text-[#4e5968]",
};

export function CourseThumb({ course, className = "" }: { course: CourseWithInstructor; className?: string }) {
  if (course.thumbnail_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={course.thumbnail_url} alt="" className={`object-cover bg-surface ${className}`} />;
  }
  return (
    <div className={`bg-gradient-to-br ${TINT[course.category]} flex items-end p-4 ${className}`}>
      <span className="text-[22px] font-extrabold tracking-[-0.04em] leading-none opacity-90">
        {CATEGORY_LABEL[course.category]}
      </span>
    </div>
  );
}

export function CourseCard({ course }: { course: CourseWithInstructor }) {
  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <CourseThumb course={course} className="aspect-[4/3] w-full rounded-2xl" />
      <div className="pt-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <SellerBadge isOfficial={course.is_official} instructor={course.instructor} />
          <span className="text-[13px] text-muted">
            {FORMAT_LABEL[course.format]}
            {course.status === "closed" && " · 모집 마감"}
          </span>
        </div>
        <h3 className="text-[17px] font-bold leading-snug text-ink group-hover:text-blue transition-colors">
          {course.title}
        </h3>
        <p className="mt-1 text-[14px] text-sub">{sellerName(course.is_official, course.instructor)}</p>
        <p className="mt-1.5 text-[16px] font-bold text-ink">{formatPrice(course.price)}</p>
      </div>
    </Link>
  );
}
