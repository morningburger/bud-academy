"use client";

import { useState, useTransition } from "react";
import { markAttendance, saveAttendanceNote } from "../actions";
import { ATTENDANCE_LABEL, ATTENDANCE_ORDER, type AttendanceStatus, type RosterStudent } from "@/lib/attendance";
import { affiliationLine } from "@/lib/format";

const ACTIVE: Record<AttendanceStatus, string> = {
  present: "bg-blue text-white",
  late: "bg-orange text-white",
  absent: "bg-red text-white",
  excused: "bg-ink-2 text-white",
};

type Mark = { status: AttendanceStatus; note: string | null };

export function Roster({
  sessionId, classDayId, students, initial,
}: {
  sessionId: string;
  classDayId: string;
  students: RosterStudent[];
  initial: Record<string, Mark>;
}) {
  const [marks, setMarks] = useState<Record<string, Mark>>(initial);
  const [error, setError] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const count = (s: AttendanceStatus) => students.filter((st) => marks[st.id]?.status === s).length;
  const unchecked = students.filter((st) => !marks[st.id]);

  function apply(ids: string[], status: AttendanceStatus | null) {
    const before = marks;
    const next = { ...marks };
    for (const id of ids) {
      if (status) next[id] = { status, note: marks[id]?.note ?? null };
      else delete next[id];
    }
    setMarks(next);
    setError(null);
    startTransition(async () => {
      const res = await markAttendance({ sessionId, classDayId, enrollmentIds: ids, status });
      if (res?.error) {
        setMarks(before);
        setError(res.error);
      }
    });
  }

  function saveNote(id: string, note: string) {
    setMarks((m) => (m[id] ? { ...m, [id]: { ...m[id], note: note.trim() || null } } : m));
    setNoteOpen(null);
    startTransition(async () => {
      const res = await saveAttendanceNote({ sessionId, classDayId, enrollmentId: id, note });
      if (res?.error) setError(res.error);
    });
  }

  if (students.length === 0) {
    return (
      <p className="rounded-2xl bg-surface py-14 text-center text-sub">
        이 회차에 수강 확정된 사람이 없어요.
        <br />
        <span className="text-[14px]">신청자를 확정하면 출석부에 나타나요.</span>
      </p>
    );
  }

  return (
    <div>
      <div className="sticky top-14 z-10 -mx-4 sm:mx-0 bg-white/95 backdrop-blur px-4 sm:px-0 py-3 border-b border-line flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-sub">
          <b className="text-blue">출석 {count("present")}</b>
          {" · "}지각 {count("late")}
          {" · "}<span className={count("absent") ? "text-red font-semibold" : ""}>결석 {count("absent")}</span>
          {count("excused") > 0 && <> · 공결 {count("excused")}</>}
          {unchecked.length > 0 && <span className="text-muted"> · 미체크 {unchecked.length}</span>}
          <span className="text-muted"> / 총 {students.length}명</span>
        </p>
        {unchecked.length > 0 && (
          <button className="btn-weak btn-sm" onClick={() => apply(unchecked.map((s) => s.id), "present")}>
            남은 {unchecked.length}명 모두 출석
          </button>
        )}
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-weak px-4 py-3 text-[14px] text-red">{error}</p>}

      <ul className="divide-y divide-line">
        {students.map((st) => {
          const m = marks[st.id];
          const line = affiliationLine(st.applicant_org_type, st.applicant_branch, st.applicant_job_title);
          return (
            <li key={st.id} className="py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-[16px]">{st.applicant_name}</p>
                  <p className="text-[13px] text-muted truncate">
                    {line}
                    {line && " · "}
                    <a href={`tel:${st.applicant_phone}`} className="text-blue">{st.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1-$2-$3")}</a>
                  </p>
                </div>
                <div className="flex gap-1.5" role="radiogroup" aria-label={`${st.applicant_name} 출결`}>
                  {ATTENDANCE_ORDER.map((s) => {
                    const on = m?.status === s;
                    return (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={on}
                        onClick={() => apply([st.id], on ? null : s)}
                        className={`h-10 min-w-[52px] px-3 rounded-lg text-[14px] font-semibold transition-colors ${
                          on ? ACTIVE[s] : "bg-surface text-sub hover:bg-surface-strong"
                        }`}
                      >
                        {ATTENDANCE_LABEL[s]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {m && (
                noteOpen === st.id ? (
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveNote(st.id, String(new FormData(e.currentTarget).get("note") ?? ""));
                    }}
                  >
                    <input name="note" defaultValue={m.note ?? ""} autoFocus className="input h-10 text-[14px]" placeholder="예: 20분 늦음, 병원 진료로 공결" maxLength={200} />
                    <button className="btn-primary btn-sm shrink-0 h-10">저장</button>
                  </form>
                ) : (
                  <button onClick={() => setNoteOpen(st.id)} className="mt-1 text-[13px] text-muted hover:text-ink">
                    {m.note ? <span className="text-ink-2">메모: {m.note}</span> : "+ 메모"}
                  </button>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
