-- 기존 명단을 올리기 전에 이미 가입한 회원도 이메일로 연결 (빈 칸만 채움). 관리자만 실행
create or replace function public.link_legacy_members()
returns integer language plpgsql security definer set search_path = ''
as $$
declare n integer;
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
  return n;
end;
$$;
revoke execute on function public.link_legacy_members() from public, anon;
grant execute on function public.link_legacy_members() to authenticated;
