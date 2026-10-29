-- 오프라인 출석 체크
-- 회차(course_sessions) 안에 수업일(class_days)을 두고, 수업일마다 확정 수강생의 출결을 기록한다.
-- 출석은 강좌 주인 강사뿐 아니라 강사진(course_instructors)에 이름이 오른 강사도 체크할 수 있다.

-- ─────────────────────────────────────────────
-- 헬퍼: 이 강좌를 가르치는 강사인가 (주인 강사 또는 강사진)
-- ─────────────────────────────────────────────
create or replace function private.teaches_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.owns_course(p_course_id) or exists (
    select 1 from public.course_instructors ci
    join public.instructors i on i.id = ci.instructor_id
    where ci.course_id = p_course_id
      and i.user_id = (select auth.uid())
      and i.status = 'approved'
  );
$$;

create or replace function private.teaches_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.course_sessions s
    where s.id = p_session_id and private.teaches_course(s.course_id)
  );
$$;

revoke execute on function private.teaches_course(uuid), private.teaches_session(uuid) from public;
grant execute on function private.teaches_course(uuid), private.teaches_session(uuid) to authenticated;

-- ─────────────────────────────────────────────
-- 테이블
-- ─────────────────────────────────────────────
create table public.class_days (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  class_date date not null,
  title text,                                   -- 예: 2회차 · 커트 실습
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (session_id, class_date)
);

create table public.attendance (
  class_day_id uuid not null references public.class_days (id) on delete cascade,
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent', 'excused')),
  note text,
  checked_by uuid references auth.users (id) on delete set null,
  checked_at timestamptz not null default now(),
  primary key (class_day_id, enrollment_id)
);

create index on public.attendance (enrollment_id);

-- 체크한 사람·시각은 서버에서 채우고, 수업일과 수강생이 같은 회차인지 확인
create or replace function private.guard_attendance()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.checked_by := (select auth.uid());
  new.checked_at := now();
  if not exists (
    select 1 from public.class_days d
    join public.enrollments e on e.session_id = d.session_id
    where d.id = new.class_day_id and e.id = new.enrollment_id
  ) then
    raise exception '이 회차 수강생이 아닙니다';
  end if;
  return new;
end;
$$;

create or replace function private.guard_class_day()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
  else
    new.session_id := old.session_id;
    new.created_by := old.created_by;
  end if;
  return new;
end;
$$;

revoke execute on function private.guard_attendance(), private.guard_class_day() from public;
grant execute on function private.guard_attendance(), private.guard_class_day() to authenticated;

create trigger guard_attendance
  before insert or update on public.attendance
  for each row execute function private.guard_attendance();

create trigger guard_class_day
  before insert or update on public.class_days
  for each row execute function private.guard_class_day();

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
alter table public.class_days enable row level security;
alter table public.attendance enable row level security;

grant select, insert, update, delete on public.class_days, public.attendance to authenticated;

create policy "class_days: 강사진/관리자" on public.class_days for all to authenticated
  using ((select private.is_admin()) or (select private.teaches_session(session_id)))
  with check ((select private.is_admin()) or (select private.teaches_session(session_id)));

-- 수강생은 자기 출결만 볼 수 있음
create policy "class_days: 수강생 조회" on public.class_days for select to authenticated
  using (exists (
    select 1 from public.enrollments e
    where e.session_id = class_days.session_id and e.user_id = (select auth.uid())
  ));

create policy "attendance: 강사진/관리자" on public.attendance for all to authenticated
  using ((select private.is_admin()) or exists (
    select 1 from public.class_days d where d.id = class_day_id and private.teaches_session(d.session_id)))
  with check ((select private.is_admin()) or exists (
    select 1 from public.class_days d where d.id = class_day_id and private.teaches_session(d.session_id)));

create policy "attendance: 수강생 본인 조회" on public.attendance for select to authenticated
  using (exists (
    select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = (select auth.uid())));

-- 강사진도 맡은 강좌의 강좌·회차·수강생 명단을 볼 수 있어야 출석을 부를 수 있음
create policy "courses: 강사진 조회" on public.courses for select to authenticated
  using ((select private.teaches_course(id)));
create policy "sessions: 강사진 조회" on public.course_sessions for select to authenticated
  using ((select private.teaches_course(course_id)));
create policy "enrollments: 강사진 조회" on public.enrollments for select to authenticated
  using ((select private.teaches_course(course_id)));
