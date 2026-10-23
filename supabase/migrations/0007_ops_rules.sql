-- 운영 규칙 반영
--  · 회원 소속(고정현헤어 지점 / 외부 살롱)·직급
--  · 공지사항
--  · 회차별 신청 마감일, 소속 인턴 전용 강좌
--  · 신청 즉시 자동 확정, 취소는 "요청 → 운영진 승인", 수업 N일 전부터 취소 요청 불가
--  · 기존 사이트(라이브클래스) 회원 명단 가져오기 → 같은 이메일로 가입하면 정보 자동 연결

-- ── 지점 목록 ─────────────────────────────────────
create table public.branches (
  name text primary key,
  sort_order integer not null default 100,
  active boolean not null default true
);
alter table public.branches enable row level security;
grant select on public.branches to anon, authenticated;
grant insert, update, delete on public.branches to authenticated;
create policy "branches: 누구나 조회" on public.branches for select to anon, authenticated using (true);
create policy "branches: 관리자 등록" on public.branches for insert to authenticated with check ((select private.is_admin()));
create policy "branches: 관리자 수정" on public.branches for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "branches: 관리자 삭제" on public.branches for delete to authenticated using ((select private.is_admin()));

insert into public.branches (name, sort_order) values
  ('시그니처점', 10), ('트레이더스구월점', 20), ('구월점', 30), ('아인애비뉴점', 40), ('부평블랙점', 50),
  ('서창점', 60), ('부평점', 70), ('롯데마트부평점', 80), ('스퀘어원1호점', 90), ('인천논현점', 100),
  ('송도학원가점', 110), ('송도센트럴점', 120), ('송도오네스타점', 130), ('루원시티점', 140), ('청라1호점', 150),
  ('청라2호점', 160), ('검단신도시점', 170), ('쉐라톤점', 180), ('시흥플랑드르점', 190), ('검단테라스점', 200),
  ('메가스타영종점', 210), ('검단그린점', 220), ('하늘도시점', 230), ('파라다이스시티점', 240),
  ('본사', 900);

-- ── 회원 소속·직급 ─────────────────────────────────
alter table public.profiles
  add column org_type text check (org_type in ('gohair', 'external')),
  add column branch text,            -- 고정현헤어 지점명 또는 외부 살롱명
  add column job_title text,
  add column marketing_agreed boolean not null default false,
  add column legacy_joined_on date;  -- 기존 사이트 가입일 (명단 연결 시)

-- ── 기존 사이트 회원 명단 (관리자 전용) ─────────────────
create table public.legacy_members (
  email text primary key check (email = lower(email)),
  raw_name text,
  name text,
  phone text,
  org_type text check (org_type in ('gohair', 'external')),
  branch text,
  job_title text,
  marketing_agreed boolean,
  enrolled boolean,
  joined_on date,
  last_seen_on date,
  claimed_by uuid references auth.users (id) on delete set null,
  claimed_at timestamptz,
  imported_at timestamptz not null default now()
);
create index on public.legacy_members (claimed_by);
alter table public.legacy_members enable row level security;
grant select, insert, update, delete on public.legacy_members to authenticated;
create policy "legacy: 관리자 조회" on public.legacy_members for select to authenticated using ((select private.is_admin()));
create policy "legacy: 관리자 등록" on public.legacy_members for insert to authenticated with check ((select private.is_admin()));
create policy "legacy: 관리자 수정" on public.legacy_members for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "legacy: 관리자 삭제" on public.legacy_members for delete to authenticated using ((select private.is_admin()));

-- 가입 시: 입력한 소속·직급 저장 + 기존 명단과 이메일이 같으면 빈 칸을 채우고 연결 표시
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  m public.legacy_members%rowtype;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  select * into m from public.legacy_members where email = lower(new.email) and claimed_by is null;

  insert into public.profiles (id, name, phone, email, org_type, branch, job_title, marketing_agreed, legacy_joined_on)
  values (
    new.id,
    coalesce(nullif(meta ->> 'name', ''), m.name),
    coalesce(nullif(meta ->> 'phone', ''), m.phone),
    new.email,
    coalesce(nullif(meta ->> 'org_type', ''), m.org_type),
    coalesce(nullif(meta ->> 'branch', ''), m.branch),
    coalesce(nullif(meta ->> 'job_title', ''), m.job_title),
    coalesce(nullif(meta ->> 'marketing_agreed', '')::boolean, m.marketing_agreed, false),
    m.joined_on
  );

  if m.email is not null then
    update public.legacy_members set claimed_by = new.id, claimed_at = now() where email = m.email;
  end if;
  return new;
end;
$$;

-- ── 공지사항 ───────────────────────────────────────
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  is_pinned boolean not null default false,
  is_published boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.notices (is_pinned desc, created_at desc);
alter table public.notices enable row level security;
grant select on public.notices to anon;
grant select, insert, update, delete on public.notices to authenticated;
create policy "notices: 게시된 공지" on public.notices for select to anon, authenticated using (is_published);
create policy "notices: 관리자 조회" on public.notices for select to authenticated using ((select private.is_admin()));
create policy "notices: 관리자 등록" on public.notices for insert to authenticated with check ((select private.is_admin()));
create policy "notices: 관리자 수정" on public.notices for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "notices: 관리자 삭제" on public.notices for delete to authenticated using ((select private.is_admin()));

-- ── 강좌·회차 규칙 ──────────────────────────────────
alter table public.courses
  add column internal_only boolean not null default false,           -- 고정현헤어 소속만 신청 가능
  add column cancel_deadline_days integer not null default 7
    check (cancel_deadline_days between 0 and 60);                   -- 수업 시작 N일 전까지만 취소 요청 가능

alter table public.course_sessions
  add column apply_deadline date;                                    -- 이 날짜까지 신청 가능 (KST)

alter table public.enrollments
  add column applicant_org_type text,
  add column applicant_branch text,
  add column applicant_job_title text,
  add column cancel_requested_at timestamptz,
  add column cancel_reason text,
  add column canceled_at timestamptz;
create index enrollments_cancel_requested on public.enrollments (cancel_requested_at) where cancel_requested_at is not null and status = 'approved';

update public.courses set internal_only = true where track = 'level';

-- 오늘(한국 시간) 기준으로 이 신청을 수강생이 취소 요청할 수 있는지
create or replace function private.cancel_window_open(p_course_id uuid, p_session_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select (now() at time zone 'Asia/Seoul')::date <= s.starts_on - c.cancel_deadline_days
       from public.course_sessions s join public.courses c on c.id = s.course_id
      where s.id = p_session_id and s.starts_on is not null),
    true);
$$;

-- 신청 규칙 (정원 집계·프로필 조회가 RLS에 막히지 않도록 definer로 실행)
create or replace function private.guard_enrollment()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_manager boolean;
  v_course public.courses%rowtype;
  v_session public.course_sessions%rowtype;
  v_profile public.profiles%rowtype;
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_taken integer;
begin
  if tg_op = 'UPDATE' then
    new.course_id := old.course_id;   -- 신청 강좌는 바꿀 수 없음 (권한 판단 전에 고정)
    new.user_id := old.user_id;
  end if;
  v_manager := private.is_admin() or private.owns_course(new.course_id) or v_uid is null;
  select * into v_course from public.courses where id = new.course_id;

  if new.session_id is not null then
    select * into v_session from public.course_sessions where id = new.session_id;
    if v_session.id is null or v_session.course_id <> new.course_id then
      raise exception '선택한 회차가 이 강좌에 속하지 않습니다';
    end if;
  end if;

  -- 수강생 신청: 규칙 확인 후 바로 확정
  if tg_op = 'INSERT' and not v_manager then
    new.user_id := v_uid;
    select * into v_profile from public.profiles where id = v_uid;
    if v_profile.org_type is null or coalesce(v_profile.branch, '') = '' or coalesce(v_profile.job_title, '') = '' then
      raise exception '회원 정보(소속·직급)를 먼저 입력해 주세요';
    end if;
    if v_course.status <> 'published' then
      raise exception '지금은 신청을 받지 않는 강좌입니다';
    end if;
    if v_course.internal_only and v_profile.org_type <> 'gohair' then
      raise exception '고정현헤어 소속만 신청할 수 있는 강좌입니다';
    end if;
    if new.session_id is null and exists (
      select 1 from public.course_sessions s where s.course_id = new.course_id and s.status = 'open') then
      raise exception '회차를 선택해 주세요';
    end if;
    if new.session_id is not null then
      if v_session.status <> 'open' then
        raise exception '모집이 마감된 회차입니다';
      end if;
      if v_session.apply_deadline is not null and v_today > v_session.apply_deadline then
        raise exception '신청 기간이 지난 회차입니다';
      end if;
    end if;
    new.status := 'approved';
    new.approved_by := null;
    new.approved_at := now();
    new.access_expires_at := null;
    new.applicant_org_type := v_profile.org_type;
    new.applicant_branch := v_profile.branch;
    new.applicant_job_title := v_profile.job_title;
    new.cancel_requested_at := null;
    new.cancel_reason := null;
    new.canceled_at := null;
  end if;

  -- 수강생 수정: 취소 요청/요청 철회만 가능
  if tg_op = 'UPDATE' and not v_manager then
    if new.status is distinct from old.status then
      if not (old.status = 'requested' and new.status = 'canceled') then
        raise exception '신청 상태는 운영진만 바꿀 수 있습니다';
      end if;
      new.canceled_at := now();
    end if;
    if old.cancel_requested_at is null and new.cancel_requested_at is not null then
      if old.status <> 'approved' then
        raise exception '확정된 신청만 취소를 요청할 수 있습니다';
      end if;
      if not private.cancel_window_open(old.course_id, old.session_id) then
        raise exception '취소 가능 기간이 지났습니다 (수업 % 일 전까지)', v_course.cancel_deadline_days;
      end if;
      new.cancel_requested_at := now();
      new.cancel_reason := left(new.cancel_reason, 300);
    elsif new.cancel_requested_at is null then
      new.cancel_reason := null;           -- 요청 철회
    else
      new.cancel_requested_at := old.cancel_requested_at;
      new.cancel_reason := old.cancel_reason;
    end if;
    new.session_id := old.session_id;
    new.applicant_name := old.applicant_name;
    new.applicant_phone := old.applicant_phone;
    new.applicant_org_type := old.applicant_org_type;
    new.applicant_branch := old.applicant_branch;
    new.applicant_job_title := old.applicant_job_title;
    new.access_expires_at := old.access_expires_at;
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
    if new.status = old.status then new.canceled_at := old.canceled_at; end if;
  end if;

  -- 운영진 처리
  if tg_op = 'UPDATE' and v_manager and new.status is distinct from old.status then
    if new.status = 'canceled' then
      new.canceled_at := now();
    elsif old.status = 'canceled' then
      new.canceled_at := null;
      new.cancel_requested_at := null;
      new.cancel_reason := null;
    end if;
    if new.status = 'approved' and old.status <> 'completed' then
      new.approved_by := v_uid;
      new.approved_at := now();
    end if;
  end if;

  -- 정원: 새로 확정되는 경우에만 확인 (동시 신청은 회차 행 잠금으로 순서대로 처리)
  if new.session_id is not null and new.status in ('requested', 'approved')
     and (tg_op = 'INSERT' or old.status in ('canceled', 'completed')) then
    perform 1 from public.course_sessions where id = new.session_id for update;
    select capacity into v_session.capacity from public.course_sessions where id = new.session_id;
    if v_session.capacity is not null then
      select count(*) into v_taken from public.enrollments
        where session_id = new.session_id and status in ('requested', 'approved', 'completed') and id <> new.id;
      if v_taken >= v_session.capacity then
        raise exception '정원(%)이 모두 찼습니다', v_session.capacity;
      end if;
    end if;
  end if;
  return new;
end;
$$;

grant execute on function private.cancel_window_open(uuid, uuid) to anon, authenticated;

-- ── 공지 초기 내용 (기존 사이트 공지를 새 방식에 맞게 정리) ─────
insert into public.notices (title, body, is_pinned, created_at) values
('[필수] 회원 정보(소속·직급)를 정확히 입력해 주세요',
'안녕하세요. 버드아카데미입니다.

고정현헤어 소속 또는 외부 디자이너가 수강 신청을 할 때는 본인 확인이 필요해요.
가입할 때(또는 내 강의실 > 회원 정보에서) 아래 항목을 정확히 입력해 주세요.

· 소속: 고정현헤어 / 다른 살롱
· 지점: 사업자등록증 기준 지점명 (외부 디자이너는 살롱 브랜드명)
· 이름: 실명
· 직급: 인턴, 디자이너, 팀장, 실장, 점장, 부원장, 원장 등

소속·직급이 비어 있으면 수강 신청을 할 수 없어요.
인턴 단계별 과정(버드 LV)은 고정현헤어 소속만 신청할 수 있어요.

문의: 기획본부팀', true, now() - interval '2 minutes'),
('[공지] 취소·환불 규정 안내',
'버드아카데미 교육 수강 규정을 꼭 확인하고 신청해 주세요.

■ 신청과 취소
1. 신청하면 바로 수강이 확정돼요.
2. 취소는 내 강의실에서 "취소 요청"을 누르고, 운영진이 승인하면 처리돼요.
3. 수업일 7일 전까지 취소 요청하면 100% 환불(취소)돼요.
4. 수업일 6일 전부터는 취소·환불이 안 되고, 양도만 가능해요.
   수업 1일 전까지 양도받는 분의 지점명·이름·직급을 기획본부팀으로 알려 주세요.

■ 다회차 교육
1. 다회차 교육은 사전 신청과 수요조사를 바탕으로 운영돼요.
2. 진행 중 개인 사유로 일부 회차에 불참하거나 중도 포기해도 교육비는 환불·감면되지 않아요.
3. 강사나 관리자에게 따로 불참 사유를 전달해도 교육비 면제·환불은 어려워요.
4. 교육 일정에 참여할 수 있는 경우에만 신청해 주세요.

문의: 기획본부팀', true, now() - interval '1 minute');
