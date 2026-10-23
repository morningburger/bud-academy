-- 버드아카데미 마켓플레이스 1단계 스키마
-- 강사 입점(신청 → 심사) + 버드아카데미 직영 강좌, 오프라인 회차, 수강 신청(수동 승인), VOD 대비 레슨 테이블

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- 내부 헬퍼(외부 API에 노출되지 않는 private 스키마)
-- ─────────────────────────────────────────────
create schema if not exists private;

-- ─────────────────────────────────────────────
-- 기본 테이블
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  headline text,
  bio text,
  career text,
  photo_url text,
  instagram text,
  affiliation text not null default 'external' check (affiliation in ('gohair', 'external')),
  branch_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- 공개되면 안 되는 강사 계약 정보(수수료, 심사 메모)는 별도 테이블
create table public.instructor_settings (
  instructor_id uuid primary key references public.instructors (id) on delete cascade,
  commission_rate numeric(5, 2) not null default 20 check (commission_rate between 0 and 100),
  review_note text,
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.instructors (id) on delete restrict,
  is_official boolean not null default false,          -- 버드아카데미 직영 강좌
  category text not null default 'etc'
    check (category in ('designer', 'perm', 'trend', 'special', 'etc')),
  format text not null default 'offline' check (format in ('offline', 'online', 'hybrid')),
  title text not null,
  summary text,
  description text,
  audience text,
  price integer check (price is null or price >= 0),   -- null = 가격 문의
  thumbnail_url text,
  location text,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'published', 'rejected', 'closed')),
  review_note text,
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_has_owner check (is_official or instructor_id is not null)
);

create table public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  label text not null,                 -- 예: 12기, 11월 특강
  starts_on date,
  ends_on date,
  schedule_text text,                  -- 예: 매주 목 10:00-13:00
  location text,
  capacity integer check (capacity is null or capacity > 0),
  status text not null default 'open' check (status in ('open', 'closed', 'canceled')),
  created_at timestamptz not null default now()
);

-- VOD 대비: 영상이 생기면 video_provider / video_ref 를 채운다
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null default 0,
  title text not null,
  video_provider text,
  video_ref text,
  duration_sec integer,
  is_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  session_id uuid references public.course_sessions (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'canceled', 'completed')),
  applicant_name text not null,
  applicant_phone text not null,
  message text,
  access_expires_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index enrollments_one_per_session
  on public.enrollments (user_id, session_id)
  where session_id is not null and status <> 'canceled';
create unique index enrollments_one_per_course_no_session
  on public.enrollments (user_id, course_id)
  where session_id is null and status <> 'canceled';

-- FK / 조회용 인덱스
create index on public.courses (instructor_id);
create index on public.courses (status);
create index on public.course_sessions (course_id);
create index on public.lessons (course_id, position);
create index on public.enrollments (course_id);
create index on public.enrollments (session_id);
create index on public.enrollments (user_id);

-- ─────────────────────────────────────────────
-- 헬퍼 함수 (RLS에서 사용, 재귀 방지를 위해 security definer + private 스키마)
-- ─────────────────────────────────────────────
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

create or replace function private.owns_course(p_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    join public.instructors i on i.id = c.instructor_id
    where c.id = p_course_id and i.user_id = (select auth.uid())
  );
$$;

create or replace function private.course_is_public(p_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    left join public.instructors i on i.id = c.instructor_id
    where c.id = p_course_id
      and c.status in ('published', 'closed')
      and (c.is_official or i.status = 'approved')
  );
$$;

create or replace function private.has_access(p_course_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course_id
      and e.user_id = (select auth.uid())
      and e.status in ('approved', 'completed')
      and (e.access_expires_at is null or e.access_expires_at > now())
  );
$$;

-- ─────────────────────────────────────────────
-- 트리거: 권한 밖의 필드 변경 차단
-- ─────────────────────────────────────────────
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 강사: 일반 사용자는 심사 상태·수수료·소속을 바꿀 수 없음
create or replace function private.guard_instructor()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if private.is_admin() or (select auth.uid()) is null then
    if tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then
      new.approved_at := now();
    end if;
    if tg_op = 'INSERT' and new.status = 'approved' then
      new.approved_at := now();
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.user_id := (select auth.uid());
    new.status := 'pending';
    new.affiliation := 'external';
    new.approved_at := null;
  else
    new.user_id := old.user_id;
    new.status := case when old.status = 'rejected' then 'pending' else old.status end; -- 반려 후 수정 시 재심사
    new.affiliation := old.affiliation;
    new.approved_at := old.approved_at;
  end if;
  return new;
end;
$$;

create trigger guard_instructor
  before insert or update on public.instructors
  for each row execute function private.guard_instructor();

create or replace function private.create_instructor_settings()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.instructor_settings (instructor_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger create_instructor_settings
  after insert on public.instructors
  for each row execute function private.create_instructor_settings();

-- 강좌: 강사는 직영 표시·게시 승인을 스스로 할 수 없음
create or replace function private.guard_course()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  new.updated_at := now();

  if private.is_admin() or (select auth.uid()) is null then
    if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
      new.published_at := now();
    end if;
    return new;
  end if;

  new.is_official := false;
  if tg_op = 'INSERT' then
    new.created_by := (select auth.uid());
    new.review_note := null;
    new.published_at := null;
    if new.status not in ('draft', 'pending_review') then
      new.status := 'draft';
    end if;
  else
    new.instructor_id := old.instructor_id;
    new.created_by := old.created_by;
    new.review_note := old.review_note;
    new.published_at := old.published_at;
    -- 허용 전환: draft/rejected → pending_review, pending_review → draft, published ↔ closed
    if new.status <> old.status and not (
         (old.status in ('draft', 'rejected') and new.status = 'pending_review')
      or (old.status = 'pending_review' and new.status = 'draft')
      or (old.status = 'published' and new.status = 'closed')
      or (old.status = 'closed' and new.status = 'published')
    ) then
      raise exception '강좌 상태를 % 에서 % (으)로 바꿀 수 없습니다', old.status, new.status;
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_course
  before insert or update on public.courses
  for each row execute function private.guard_course();

-- 수강 신청: 수강생은 신청/취소만, 승인은 강사(본인 강좌)와 관리자만. 정원 초과 승인 차단
create or replace function private.guard_enrollment()
returns trigger language plpgsql security invoker set search_path = ''
as $$
declare
  v_manager boolean;
  v_capacity integer;
  v_taken integer;
begin
  if tg_op = 'UPDATE' then
    new.course_id := old.course_id;   -- 신청 강좌는 바꿀 수 없음 (권한 판단 전에 고정)
  end if;
  v_manager := private.is_admin() or private.owns_course(new.course_id) or (select auth.uid()) is null;

  if tg_op = 'INSERT' and not v_manager then
    new.user_id := (select auth.uid());
    new.status := 'requested';
    new.approved_by := null;
    new.approved_at := null;
    new.access_expires_at := null;
  end if;

  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    if not v_manager then
      if not (old.status = 'requested' and new.status in ('requested', 'canceled')) then
        raise exception '신청 상태는 담당 강사나 관리자만 바꿀 수 있습니다';
      end if;
      new.session_id := old.session_id;
      new.access_expires_at := old.access_expires_at;
      new.approved_by := old.approved_by;
      new.approved_at := old.approved_at;
    end if;
  end if;

  if new.session_id is not null then
    if not exists (select 1 from public.course_sessions s where s.id = new.session_id and s.course_id = new.course_id) then
      raise exception '선택한 회차가 이 강좌에 속하지 않습니다';
    end if;
  end if;

  if new.status = 'approved' and (tg_op = 'INSERT' or old.status <> 'approved') then
    new.approved_by := (select auth.uid());
    new.approved_at := now();
    if new.session_id is not null then
      select capacity into v_capacity from public.course_sessions where id = new.session_id for update;
      if v_capacity is not null then
        select count(*) into v_taken from public.enrollments
          where session_id = new.session_id and status in ('approved', 'completed') and id <> new.id;
        if v_taken >= v_capacity then
          raise exception '정원(%)이 모두 찼습니다', v_capacity;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_enrollment
  before insert or update on public.enrollments
  for each row execute function private.guard_enrollment();

-- 정원 계산은 수강생 정보 없이 숫자만 공개
create or replace function public.session_seats(p_course_id uuid)
returns table (session_id uuid, taken integer)
language sql stable security definer set search_path = ''
as $$
  select e.session_id, count(*)::int
  from public.enrollments e
  where e.course_id = p_course_id
    and e.session_id is not null
    and e.status in ('requested', 'approved', 'completed')
    and private.course_is_public(p_course_id)
  group by e.session_id;
$$;
-- 권한: private 헬퍼는 RLS·트리거용으로만 실행 허용 (API로는 노출되지 않는 스키마)
grant usage on schema private to anon, authenticated;
revoke execute on all functions in schema private from public;
grant execute on function private.is_admin(), private.owns_course(uuid), private.course_is_public(uuid),
  private.has_access(uuid), private.guard_instructor(), private.guard_course(), private.guard_enrollment()
  to anon, authenticated;
revoke execute on function public.session_seats(uuid) from public;
grant execute on function public.session_seats(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.instructors enable row level security;
alter table public.instructor_settings enable row level security;
alter table public.courses enable row level security;
alter table public.course_sessions enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;

grant select on public.instructors, public.courses, public.course_sessions to anon;
grant select, insert, update on public.profiles, public.instructors, public.courses,
  public.course_sessions, public.lessons, public.enrollments to authenticated;
grant delete on public.course_sessions, public.lessons to authenticated;
grant select on public.admins to authenticated;
grant select, update on public.instructor_settings to authenticated;

-- profiles
create policy "profiles: 본인 또는 관리자 조회" on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()));
create policy "profiles: 본인 수정" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- admins
create policy "admins: 본인 행 확인" on public.admins for select to authenticated
  using ((select auth.uid()) = user_id);

-- instructors
create policy "instructors: 승인된 강사 공개" on public.instructors for select to anon, authenticated
  using (status = 'approved');
create policy "instructors: 본인/관리자 조회" on public.instructors for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()));
create policy "instructors: 입점 신청" on public.instructors for insert to authenticated
  with check ((select auth.uid()) = user_id or (select private.is_admin()));
create policy "instructors: 본인/관리자 수정" on public.instructors for update to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()))
  with check ((select auth.uid()) = user_id or (select private.is_admin()));

-- instructor_settings (수수료·심사 메모: 본인 열람, 관리자만 수정)
create policy "settings: 본인/관리자 조회" on public.instructor_settings for select to authenticated
  using ((select private.is_admin()) or exists (
    select 1 from public.instructors i where i.id = instructor_id and i.user_id = (select auth.uid())));
create policy "settings: 관리자 수정" on public.instructor_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- courses
create policy "courses: 공개 강좌" on public.courses for select to anon, authenticated
  using ((select private.course_is_public(id)));
create policy "courses: 담당 강사/관리자 조회" on public.courses for select to authenticated
  using ((select private.is_admin()) or exists (
    select 1 from public.instructors i where i.id = instructor_id and i.user_id = (select auth.uid())));
create policy "courses: 승인 강사 등록 또는 관리자" on public.courses for insert to authenticated
  with check ((select private.is_admin()) or exists (
    select 1 from public.instructors i
    where i.id = instructor_id and i.user_id = (select auth.uid()) and i.status = 'approved'));
create policy "courses: 담당 강사/관리자 수정" on public.courses for update to authenticated
  using ((select private.is_admin()) or exists (
    select 1 from public.instructors i where i.id = instructor_id and i.user_id = (select auth.uid())))
  with check ((select private.is_admin()) or exists (
    select 1 from public.instructors i where i.id = instructor_id and i.user_id = (select auth.uid())));

-- course_sessions
create policy "sessions: 공개 강좌 회차" on public.course_sessions for select to anon, authenticated
  using ((select private.course_is_public(course_id)));
create policy "sessions: 담당 강사/관리자 조회" on public.course_sessions for select to authenticated
  using ((select private.is_admin()) or (select private.owns_course(course_id)));
create policy "sessions: 담당 강사/관리자 등록" on public.course_sessions for insert to authenticated
  with check ((select private.is_admin()) or (select private.owns_course(course_id)));
create policy "sessions: 담당 강사/관리자 수정" on public.course_sessions for update to authenticated
  using ((select private.is_admin()) or (select private.owns_course(course_id)))
  with check ((select private.is_admin()) or (select private.owns_course(course_id)));
create policy "sessions: 담당 강사/관리자 삭제" on public.course_sessions for delete to authenticated
  using ((select private.is_admin()) or (select private.owns_course(course_id)));

-- lessons (영상 정보는 수강 권한자만)
create policy "lessons: 수강생·담당 강사·관리자·미리보기" on public.lessons for select to authenticated
  using (is_preview or (select private.is_admin()) or (select private.owns_course(course_id))
         or (select private.has_access(course_id)));
create policy "lessons: 담당 강사/관리자 등록" on public.lessons for insert to authenticated
  with check ((select private.is_admin()) or (select private.owns_course(course_id)));
create policy "lessons: 담당 강사/관리자 수정" on public.lessons for update to authenticated
  using ((select private.is_admin()) or (select private.owns_course(course_id)))
  with check ((select private.is_admin()) or (select private.owns_course(course_id)));
create policy "lessons: 담당 강사/관리자 삭제" on public.lessons for delete to authenticated
  using ((select private.is_admin()) or (select private.owns_course(course_id)));

-- enrollments
create policy "enrollments: 본인·담당 강사·관리자 조회" on public.enrollments for select to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()) or (select private.owns_course(course_id)));
create policy "enrollments: 공개 강좌에 본인 신청" on public.enrollments for insert to authenticated
  with check (((select auth.uid()) = user_id and (select private.course_is_public(course_id)))
              or (select private.is_admin()) or (select private.owns_course(course_id)));
create policy "enrollments: 본인 취소·강사/관리자 처리" on public.enrollments for update to authenticated
  using ((select auth.uid()) = user_id or (select private.is_admin()) or (select private.owns_course(course_id)))
  with check ((select auth.uid()) = user_id or (select private.is_admin()) or (select private.owns_course(course_id)));

-- ─────────────────────────────────────────────
-- 이미지 저장소 (강사 사진, 강좌 썸네일) — 본인 폴더에만 업로드
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "media: 본인 폴더 업로드" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: 본인 파일 조회" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: 본인 파일 교체" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "media: 본인 파일 삭제" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
