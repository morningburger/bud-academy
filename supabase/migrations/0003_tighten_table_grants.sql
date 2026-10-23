-- 기본 권한(모든 테이블 anon/authenticated 전체 허용)을 걷어내고 필요한 것만 다시 부여
revoke all on all tables in schema public from anon, authenticated;

grant select on public.instructors, public.courses, public.course_sessions to anon;

grant select, insert, update on public.profiles, public.instructors, public.courses,
  public.course_sessions, public.lessons, public.enrollments to authenticated;
grant delete on public.course_sessions, public.lessons to authenticated;
grant select on public.admins to authenticated;
grant select, update on public.instructor_settings to authenticated;

-- 앞으로 만드는 테이블도 기본적으로 닫아 둔다
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;
