-- 기존 사이트(라이브클래스)에서 이미 받은 신청을 옮겨 두고,
-- 그 회원이 같은 이메일(또는 휴대폰)로 가입하면 새 사이트 신청으로 자동 연결한다
create table public.legacy_enrollments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  email text check (email = lower(email)),
  phone text,
  raw_name text,
  imported_at timestamptz not null default now(),
  enrollment_id uuid references public.enrollments (id) on delete set null,
  claimed_at timestamptz,
  check (email is not null or phone is not null)
);
create unique index legacy_enrollments_email on public.legacy_enrollments (session_id, email) where email is not null;
create unique index legacy_enrollments_phone on public.legacy_enrollments (session_id, phone) where email is null;
create index on public.legacy_enrollments (email);
create index on public.legacy_enrollments (phone);
create index on public.legacy_enrollments (course_id);
alter table public.legacy_enrollments enable row level security;
grant select, insert, update, delete on public.legacy_enrollments to authenticated;
create policy "legacy_enr: 관리자 조회" on public.legacy_enrollments for select to authenticated using ((select private.is_admin()));
create policy "legacy_enr: 관리자 등록" on public.legacy_enrollments for insert to authenticated with check ((select private.is_admin()));
create policy "legacy_enr: 관리자 수정" on public.legacy_enrollments for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "legacy_enr: 관리자 삭제" on public.legacy_enrollments for delete to authenticated using ((select private.is_admin()));

-- 한 회원의 기존 신청을 새 사이트 신청(수강 확정)으로 만든다. 정원 등으로 실패한 건은 건너뛰고 남겨 둔다
create or replace function private.claim_legacy_enrollments(p_user uuid)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  p public.profiles%rowtype;
  r public.legacy_enrollments%rowtype;
  v_id uuid;
  n integer := 0;
begin
  select * into p from public.profiles where id = p_user;
  if p.id is null then return 0; end if;
  for r in
    select * from public.legacy_enrollments l
    where l.enrollment_id is null
      and ((l.email is not null and l.email = lower(p.email))
           or (l.email is null and l.phone is not null and l.phone = p.phone))
  loop
    begin
      select e.id into v_id from public.enrollments e
        where e.user_id = p_user and e.session_id = r.session_id and e.status <> 'canceled';
      if v_id is null then
        insert into public.enrollments (course_id, session_id, user_id, status, applicant_name, applicant_phone,
          applicant_org_type, applicant_branch, applicant_job_title, message, approved_at)
        values (r.course_id, r.session_id, p_user, 'approved',
          coalesce(p.name, r.raw_name, '이름 없음'), coalesce(p.phone, r.phone, ''),
          p.org_type, p.branch, p.job_title, '기존 사이트에서 신청', now())
        returning id into v_id;
      end if;
      update public.legacy_enrollments set enrollment_id = v_id, claimed_at = now() where id = r.id;
      n := n + 1;
    exception when others then
      null;  -- 정원 초과 등: 그대로 두고 운영진이 확인
    end;
  end loop;
  return n;
end;
$$;
revoke execute on function private.claim_legacy_enrollments(uuid) from public, anon, authenticated;

-- 가입할 때: 회원 정보 연결 + 기존 신청 연결
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
  perform private.claim_legacy_enrollments(new.id);
  return new;
end;
$$;

-- 관리자: 이미 가입한 회원에게 기존 명단·신청을 한 번에 연결
create or replace function public.link_legacy_members()
returns integer language plpgsql security definer set search_path = ''
as $$
declare n integer; uid uuid;
begin
  if not private.is_admin() then
    raise exception '관리자만 실행할 수 있습니다';
  end if;
  with hit as (
    update public.legacy_members m set claimed_by = p.id, claimed_at = now()
    from public.profiles p
    where m.claimed_by is null and lower(p.email) = m.email
    returning m.*, p.id as pid
  )
  update public.profiles p set
    name = coalesce(p.name, hit.name),
    phone = coalesce(p.phone, hit.phone),
    org_type = coalesce(p.org_type, hit.org_type),
    branch = coalesce(p.branch, hit.branch),
    job_title = coalesce(p.job_title, hit.job_title),
    legacy_joined_on = coalesce(p.legacy_joined_on, hit.joined_on)
  from hit where p.id = hit.pid;
  get diagnostics n = row_count;

  for uid in
    select distinct p.id from public.profiles p
    join public.legacy_enrollments l on l.enrollment_id is null
      and ((l.email is not null and l.email = lower(p.email)) or (l.email is null and l.phone = p.phone))
  loop
    perform private.claim_legacy_enrollments(uid);
  end loop;
  return n;
end;
$$;
revoke execute on function public.link_legacy_members() from public, anon;
grant execute on function public.link_legacy_members() to authenticated;
