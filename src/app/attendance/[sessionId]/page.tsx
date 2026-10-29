import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { ATTENDANCE_LABEL, attendanceRate, type AttendanceStatus } from "@/lib/attendance";
import { loadAttendanceBook } from "@/lib/attendance-server";
import { formatDate, formatRange, todayKST } from "@/lib/format";
import { deleteClassDay } from "../actions";
import { AddDayForm } from "./add-day";
import { Roster } from "./roster";

export const metadata: Metadata = { title: "출석 체크" };

const CELL: Record<AttendanceStatus, string> = {
  present: "text-blue",
  late: "text-orange",
  absent: "text-red",
  excused: "text-sub",
};

export default async function AttendancePage({ params, searchParams }: PageProps<"/attendance/[sessionId]">) {
  const { sessionId } = await params;
  const { day, view } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) notFound();
  const viewer = await requireViewer(`/attendance/${sessionId}`);
  const book = await loadAttendanceBook(sessionId, viewer);
  if (!book) notFound();
  const { session, course, days, students, marks } = book;

  const today = todayKST();
  const todayDay = days.find((d) => d.class_date === today);
  const selected =
    days.find((d) => d.id === day) ??
    todayDay ??
    [...days].reverse().find((d) => d.class_date <= today) ??
    days[0];
  const isBook = view === "book";
  const back = viewer.isAdmin || !viewer.instructor ? `/manage/courses/${course.id}?tab=sessions` : "/studio";

  return (
    <div className="mx-auto max-w-[880px] px-4 sm:px-6 pt-8 pb-16">
      <Link href={back} className="text-[14px] text-sub hover:text-ink">‹ {back === "/studio" ? "강사 스튜디오" : "회차 관리"}</Link>
      <p className="mt-3 text-[14px] text-muted">{course.title}</p>
      <h1 className="mt-0.5 text-[26px] font-extrabold tracking-[-0.04em]">{session.label} 출석 체크</h1>
      <p className="text-[14px] text-sub">
        {[formatRange(session.starts_on, session.ends_on), session.schedule_text, `수강생 ${students.length}명`].filter(Boolean).join(" · ")}
      </p>

      <nav className="mt-6 flex gap-1 border-b border-line">
        {[
          ["", "출석 부르기"],
          ["book", "전체 출석부"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={key ? `?view=${key}` : selected ? `?day=${selected.id}` : "?"}
            className={`px-4 h-11 inline-flex items-center text-[15px] font-semibold border-b-2 -mb-px ${
              (key === "book") === isBook ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink-2"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {!isBook && (
        <div className="pt-5">
          {days.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {days.map((d, i) => {
                const on = d.id === selected?.id;
                const done = marks.filter((m) => m.class_day_id === d.id).length;
                return (
                  <Link
                    key={d.id}
                    href={`?day=${d.id}`}
                    className={`shrink-0 rounded-xl px-3.5 py-2 text-left ${on ? "bg-ink text-white" : "bg-surface text-ink-2 hover:bg-surface-strong"}`}
                  >
                    <span className="block text-[12px] opacity-70">{i + 1}회차{d.class_date === today ? " · 오늘" : ""}</span>
                    <span className="block text-[14px] font-semibold">{formatDate(d.class_date)}</span>
                    <span className="block text-[12px] opacity-70">{done}/{students.length} 체크</span>
                  </Link>
                );
              })}
            </div>
          )}

          {!todayDay && (
            <div className={`mt-4 rounded-2xl p-4 ${days.length ? "bg-surface" : "panel"}`}>
              {days.length === 0 && <p className="mb-3 text-[15px] text-sub">수업 날짜를 정하면 그날 출석을 부를 수 있어요.</p>}
              <AddDayForm sessionId={session.id} defaultDate={today} primary={days.length === 0 || (session.starts_on ?? today) <= today} />
            </div>
          )}

          {selected && (
            <section className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[18px] font-bold">
                  {formatDate(selected.class_date)}
                  {selected.title && <span className="ml-2 text-[15px] font-medium text-sub">{selected.title}</span>}
                </h2>
                <form action={deleteClassDay}>
                  <input type="hidden" name="id" value={selected.id} />
                  <input type="hidden" name="session_id" value={session.id} />
                  <button className="text-[13px] text-muted hover:text-red">이 수업일 삭제</button>
                </form>
              </div>
              <Roster
                key={selected.id}
                sessionId={session.id}
                classDayId={selected.id}
                students={students}
                initial={Object.fromEntries(
                  marks.filter((m) => m.class_day_id === selected.id).map((m) => [m.enrollment_id, { status: m.status, note: m.note }]),
                )}
              />
            </section>
          )}

          {todayDay && (
            <details className="mt-10">
              <summary className="cursor-pointer text-[14px] text-sub">다른 수업일 추가</summary>
              <div className="mt-3"><AddDayForm sessionId={session.id} defaultDate={today} /></div>
            </details>
          )}
        </div>
      )}

      {isBook && (
        <div className="pt-5">
          {days.length === 0 || students.length === 0 ? (
            <p className="rounded-2xl bg-surface py-14 text-center text-sub">아직 기록된 출석이 없어요.</p>
          ) : (
            <>
              <div className="flex justify-end mb-3">
                <a href={`/attendance/${session.id}/export`} className="btn-gray btn-sm">엑셀로 받기</a>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-[14px] whitespace-nowrap">
                  <thead className="bg-surface text-sub">
                    <tr>
                      <th className="sticky left-0 bg-surface px-4 py-3 text-left font-semibold">이름</th>
                      {days.map((d, i) => (
                        <th key={d.id} className="px-3 py-3 font-semibold">
                          <Link href={`?day=${d.id}`} className="hover:text-ink">
                            <span className="block text-[12px] font-medium text-muted">{i + 1}회차</span>
                            {d.class_date.slice(5).replace("-", ".")}
                          </Link>
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold">출석률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {students.map((st) => {
                      const mine = marks.filter((m) => m.enrollment_id === st.id);
                      const rate = attendanceRate(mine);
                      return (
                        <tr key={st.id}>
                          <td className="sticky left-0 bg-white px-4 py-3 font-semibold">{st.applicant_name}</td>
                          {days.map((d) => {
                            const m = mine.find((x) => x.class_day_id === d.id);
                            return (
                              <td key={d.id} className={`px-3 py-3 text-center font-semibold ${m ? CELL[m.status] : "text-muted"}`} title={m?.note ?? undefined}>
                                {m ? ATTENDANCE_LABEL[m.status] : "–"}
                                {m?.note && <sup className="text-muted">*</sup>}
                              </td>
                            );
                          })}
                          <td className={`px-4 py-3 text-center font-bold ${rate !== null && rate < 80 ? "text-red" : ""}`}>
                            {rate === null ? "–" : `${rate}%`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[13px] text-muted">출석률은 지각을 출석으로 치고, 공결은 빼고 계산해요. 80% 미만은 빨간색이에요. * 표시는 메모가 있는 칸이에요.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
