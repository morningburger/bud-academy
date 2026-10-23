-- 직원(운영진) 관리: 회원 검색용 이메일, 관리자 권한 부여/해제

alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;
create index on public.profiles (lower(email));

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, phone, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'phone', new.email);
  return new;
end;
$$;

-- 이메일 변경 시 동기화
create or replace function private.sync_profile_email()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.sync_profile_email();

-- 관리자: 다른 관리자 목록 조회, 추가, 해제 (본인 해제는 앱에서 막음)
grant insert, delete on public.admins to authenticated;
create policy "admins: 관리자 전체 조회" on public.admins for select to authenticated
  using ((select private.is_admin()));
create policy "admins: 관리자 추가" on public.admins for insert to authenticated
  with check ((select private.is_admin()));
create policy "admins: 관리자 해제" on public.admins for delete to authenticated
  using ((select private.is_admin()) and user_id <> (select auth.uid()));
