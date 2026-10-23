-- 강좌를 이해하기 쉽게 보여주기 위한 상세 항목 + 강사진(여러 명) 연결
-- 실제 버드아카데미 구성(단계별 과정·초청 원장·브랜드·리더십)은 track 으로 구분한다.
-- (기존 category 컬럼은 호환용으로 남겨 둠)

alter table public.courses
  add column track text not null default 'etc'
    check (track in ('level', 'guest', 'brand', 'leadership', 'trend', 'etc')),
  add column level smallint check (level between 1 and 9),       -- 버드 LV 단계
  add column curriculum jsonb not null default '[]'::jsonb check (jsonb_typeof(curriculum) = 'array'), -- [{title, detail}]
  add column materials text[] not null default '{}',             -- 준비물
  add column eligibility text,                                   -- 수강 자격 안내
  add column price_note text,                                    -- 예: 교재비 8만원 별도
  add column gallery text[] not null default '{}',               -- 상세 이미지
  add column schedule_summary text,                              -- 예: 격주 화요일 · 4회
  add column sort_order integer not null default 100;

-- 강사진: 한 강좌에 여러 강사 (직영 강좌의 소속 강사, 초청 강사)
create table public.course_instructors (
  course_id uuid not null references public.courses (id) on delete cascade,
  instructor_id uuid not null references public.instructors (id) on delete cascade,
  role text,                     -- 예: 클리퍼&드라이 · 1반
  position integer not null default 0,
  primary key (course_id, instructor_id)
);
create index on public.course_instructors (instructor_id);

alter table public.course_instructors enable row level security;
grant select on public.course_instructors to anon;
grant select, insert, update, delete on public.course_instructors to authenticated;

create policy "course_instructors: 공개 강좌" on public.course_instructors for select to anon, authenticated
  using ((select private.course_is_public(course_id)));
create policy "course_instructors: 담당 강사/관리자 조회" on public.course_instructors for select to authenticated
  using ((select private.is_admin()) or (select private.owns_course(course_id)));
create policy "course_instructors: 관리자 등록" on public.course_instructors for insert to authenticated
  with check ((select private.is_admin()));
create policy "course_instructors: 관리자 수정" on public.course_instructors for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "course_instructors: 관리자 삭제" on public.course_instructors for delete to authenticated
  using ((select private.is_admin()));
