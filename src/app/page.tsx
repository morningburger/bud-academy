import Link from "next/link";
import { listPublicCourses, listUpcomingSessions } from "@/lib/queries";
import { CourseCard } from "@/components/course-card";
import { CATEGORY_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

function DateBlock({ date }: { date: string }) {
  const d = new Date(date + "T00:00:00+09:00");
  const month = new Intl.DateTimeFormat("ko-KR", { month: "numeric", timeZone: "Asia/Seoul" }).format(d);
  const day = new Intl.DateTimeFormat("ko-KR", { day: "numeric", timeZone: "Asia/Seoul" }).format(d).replace("일", "");
  const wd = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "Asia/Seoul" }).format(d);
  return (
    <div className="w-14 shrink-0 text-center">
      <div className="text-[12px] font-semibold text-blue">{month}</div>
      <div className="text-[26px] font-extrabold leading-none tracking-[-0.04em] text-ink">{day}</div>
      <div className="text-[12px] text-muted mt-0.5">{wd}</div>
    </div>
  );
}

export default async function Home() {
  const [courses, upcoming] = await Promise.all([listPublicCourses(), listUpcomingSessions(5)]);

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6">
      <section className="pt-12 sm:pt-16 pb-10 grid gap-10 lg:grid-cols-[1fr_440px] lg:items-start">
        <div>
          <h1 className="text-[34px] sm:text-[46px] font-extrabold leading-[1.18] tracking-[-0.045em] text-ink">
            살롱에서 쓰는 기술을
            <br />
            살롱에서 배우세요
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-sub max-w-[440px]">
            고정현헤어 디자이너와 현장 전문가가 직접 여는 헤어 교육. 디자이너 양성부터 열펌, 시즌 트렌드까지.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/courses" className="btn-primary btn-lg px-6">강좌 둘러보기</Link>
            <Link href="/partner" className="btn-gray btn-lg px-6">강사로 참여하기</Link>
          </div>
        </div>

        <div className="rounded-3xl bg-surface p-5 sm:p-6">
          <h2 className="text-[17px] font-bold text-ink mb-1">다가오는 개강</h2>
          <p className="text-[14px] text-muted mb-4">자리가 남은 회차만 보여드려요</p>
          {upcoming.length === 0 ? (
            <div className="rounded-2xl bg-white px-5 py-8 text-center text-[15px] text-sub">
              예정된 개강 일정이 아직 없어요.
              <br />
              <Link href="/courses" className="text-blue font-semibold">전체 강좌</Link>에서 상시 진행 과정을 확인하세요.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/courses/${s.course.id}`}
                    className="flex items-center gap-4 rounded-2xl bg-white px-4 py-4 hover:bg-[#fafbfc]"
                  >
                    {s.starts_on && <DateBlock date={s.starts_on} />}
                    <div className="min-w-0">
                      <p className="text-[16px] font-bold text-ink truncate">{s.course.title}</p>
                      <p className="text-[14px] text-sub truncate">
                        {s.label}
                        {s.schedule_text ? ` · ${s.schedule_text}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="pt-6">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-[22px] font-bold tracking-[-0.03em]">전체 강좌</h2>
          <Link href="/courses" className="text-[15px] text-sub hover:text-ink">모두 보기</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <Link key={key} href={`/courses?category=${key}`} className="btn-gray btn-sm whitespace-nowrap">
              {label}
            </Link>
          ))}
        </div>
        {courses.length === 0 ? (
          <p className="text-sub py-10">공개된 강좌가 아직 없어요.</p>
        ) : (
          <div className="grid gap-x-5 gap-y-9 grid-cols-2 lg:grid-cols-4">
            {courses.slice(0, 8).map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-20 rounded-3xl bg-ink text-white px-6 sm:px-10 py-10 sm:py-12 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="text-[24px] sm:text-[28px] font-extrabold tracking-[-0.035em] leading-snug">
            가르칠 기술이 있다면
            <br />
            버드아카데미에서 강좌를 여세요
          </h2>
          <p className="mt-3 text-[15px] text-[#b0b8c1] max-w-[460px]">
            모객 페이지, 신청 접수, 수강생 관리를 플랫폼이 맡습니다. 신청서를 보내주시면 심사 후 연락드려요.
          </p>
        </div>
        <Link href="/partner" className="btn btn-lg bg-white text-ink hover:bg-surface px-6">입점 안내 보기</Link>
      </section>
    </div>
  );
}
