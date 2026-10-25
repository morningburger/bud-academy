import Link from "next/link";
import { listLevelCourses, listPublicCourses, listUpcomingSessions } from "@/lib/queries";
import { getViewer } from "@/lib/auth";
import { CourseCard } from "@/components/course-card";
import { Avatar } from "@/components/avatar";
import { TRACK_LABEL, coursePrice, isRecruiting } from "@/lib/format";

export const dynamic = "force-dynamic";

// 기존 사이트(budacademy.co.kr) 누적 운영 수치. 신청 건수 ≥ 참여 인원 순서가 맞도록 단위·이름 정리
const STATS = [
  { value: "20,692건+", label: "누적 수강 신청" },
  { value: "12,175명+", label: "교육 참여 디자이너" },
  { value: "2,540회+", label: "진행한 교육" },
];

function DateBlock({ date }: { date: string }) {
  const d = new Date(date + "T00:00:00+09:00");
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ko-KR", { ...o, timeZone: "Asia/Seoul" }).format(d);
  return (
    <div className="w-14 shrink-0 text-center">
      <div className="text-[12px] font-semibold text-blue">{f({ month: "long" })}</div>
      <div className="text-[28px] font-extrabold leading-none tracking-[-0.04em] text-ink">{f({ day: "numeric" }).replace("일", "")}</div>
      <div className="text-[12px] text-muted mt-0.5">{f({ weekday: "short" })}</div>
    </div>
  );
}

export default async function Home() {
  const [levels, all, upcoming, viewer] = await Promise.all([listLevelCourses(), listPublicCourses(), listUpcomingSessions(4), getViewer()]);
  const others = all
    .filter((c) => c.track !== "level" && c.status === "published")
    .map((c, i) => ({ c, i, open: isRecruiting(c, c.sessions) }))
    .sort((a, b) => Number(b.open) - Number(a.open) || a.i - b.i)
    .map((r) => r.c);
  const pastCount = all.filter((c) => c.status === "closed").length;

  return (
    <div>
      {/* 소개 */}
      <section className="mx-auto max-w-[1040px] px-4 sm:px-6 pt-10 sm:pt-14 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div>
          <p className="text-[15px] font-semibold text-blue">고정현헤어 교육 아카데미</p>
          <h1 className="mt-2 text-[34px] sm:text-[44px] font-extrabold leading-[1.2] tracking-[-0.045em] text-ink">
            인턴에서 디자이너까지,
            <br />
            살롱에서 쓰는 기술을
            <br />
            살롱에서 배워요
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-sub max-w-[440px]">
            단계별 정규 과정부터 초청 원장 클래스, 브랜드 교육, 리더십까지. 버드아카데미가 디자이너의 성장 경로를 함께 설계해요.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href="/courses" className="btn-primary btn-lg px-6">강좌 둘러보기</Link>
            <Link href="#roadmap" className="btn-gray btn-lg px-6">단계별 과정 보기</Link>
          </div>
        </div>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/academy-space.webp" alt="버드아카데미 교육장" className="w-full aspect-[16/10] object-cover rounded-3xl" />
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface px-3 py-3 sm:px-4">
                <dd className="text-[18px] sm:text-[22px] font-extrabold tracking-[-0.03em]">{s.value}</dd>
                <dt className="text-[12px] sm:text-[13px] text-sub">{s.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-1.5 text-right text-[11px] text-muted">버드아카데미 누적 운영 기준</p>
        </div>
      </section>

      {/* 단계별 로드맵 */}
      {levels.length > 0 && (
        <section id="roadmap" className="mt-20 bg-surface scroll-mt-16">
          <div className="mx-auto max-w-[1040px] px-4 sm:px-6 py-14">
            <h2 className="text-[26px] sm:text-[30px] font-extrabold tracking-[-0.04em]">3단계로 디자이너가 돼요</h2>
            <p className="mt-2 text-sub">고정현헤어 인턴은 LV1부터 차례로 올라가요. 단계마다 지점 선배 디자이너가 직접 가르칩니다.</p>
            <ol className="mt-8 grid gap-3 md:grid-cols-3">
              {levels.map((c, i) => {
                const short = c.title.split("·").slice(1).join("·").trim() || c.title;
                const people = (c.lineup ?? []).map((l) => l.instructor!).filter(Boolean);
                return (
                  <li key={c.id} className="relative">
                    <Link href={`/courses/${c.id}`} className="group flex h-full flex-col rounded-3xl bg-white p-5 hover:shadow-[0_8px_24px_rgba(0,27,55,0.08)] transition-shadow">
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-ink px-2.5 py-1 text-[13px] font-extrabold text-white">LV{c.level}</span>
                        {i < levels.length - 1 && <span aria-hidden className="hidden md:block text-[20px] text-muted">→</span>}
                      </div>
                      <h3 className="mt-4 text-[20px] font-extrabold leading-snug tracking-[-0.03em] group-hover:text-blue">{short}</h3>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {c.curriculum.map((it) => (
                          <li key={it.title} className="chip-gray">{it.title}</li>
                        ))}
                      </ul>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {c.thumbnail_url && <img src={c.thumbnail_url} alt="" className="mt-5 aspect-[16/10] w-full rounded-2xl object-cover bg-surface" loading="lazy" />}
                      <div className="mt-4 flex items-center gap-2 pt-1">
                        <div className="flex -space-x-2">
                          {people.slice(0, 4).map((p) => (
                            <span key={p.id} className="rounded-full ring-2 ring-white">
                              <Avatar name={p.name} url={p.photo_url} size={30} />
                            </span>
                          ))}
                        </div>
                        <span className="text-[13px] text-sub truncate">{people.map((p) => p.name).join(" · ")}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1040px] px-4 sm:px-6">
        {/* 곧 열리는 클래스 */}
        {upcoming.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">곧 열리는 클래스</h2>
            <p className="mt-1 text-sub">지금 신청할 수 있는 일정이에요.</p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {upcoming.map((s) => (
                <li key={s.id}>
                  <Link href={`/courses/${s.course.id}`} className="flex items-center gap-4 rounded-2xl border border-line px-4 py-4 hover:bg-surface">
                    {s.starts_on && <DateBlock date={s.starts_on} />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-blue">{TRACK_LABEL[s.course.track as keyof typeof TRACK_LABEL]}</p>
                      <p className="text-[16px] font-bold text-ink truncate">{s.course.title}</p>
                      <p className="text-[14px] text-sub truncate">{[s.schedule_text, coursePrice(s.course, viewer).main].filter(Boolean).join(" · ")}</p>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {s.course.thumbnail_url && <img src={s.course.thumbnail_url} alt="" className="hidden sm:block size-16 rounded-xl object-cover shrink-0" />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 그 밖의 과정 */}
        {others.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-[24px] font-extrabold tracking-[-0.04em]">초청 원장 · 브랜드 · 리더십</h2>
                <p className="mt-1 text-sub">현장에서 이름난 원장과 브랜드 교육팀을 직접 모셔 와요. 초청 원장 클래스는 다른 살롱 디자이너도 신청할 수 있어요.</p>
              </div>
              <Link href="/courses" className="hidden sm:block shrink-0 text-[15px] text-sub hover:text-ink">전체 강좌</Link>
            </div>
            <div className="grid gap-x-5 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((c) => <CourseCard key={c.id} course={c} viewer={viewer} />)}
            </div>
            {pastCount > 0 && (
              <Link href="/courses#past" className="mt-8 flex items-center justify-between rounded-2xl border border-line px-5 py-4 hover:bg-surface">
                <span className="text-[15px]"><b className="font-bold">지난 교육 둘러보기</b><span className="ml-2 text-sub">그동안 버드아카데미에서 진행한 초청 강의와 특강</span></span>
                <span aria-hidden className="text-muted">→</span>
              </Link>
            )}
          </section>
        )}

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
    </div>
  );
}
