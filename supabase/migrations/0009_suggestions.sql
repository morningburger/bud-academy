-- 교육 건의함: 회원이 듣고 싶은 교육·추천 강사·운영 건의를 남기고, 운영진이 확인
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('topic', 'instructor', 'operation', 'etc')),
  body text not null check (char_length(body) between 2 and 2000),
  status text not null default 'new' check (status in ('new', 'read', 'done')),
  admin_note text,
  created_at timestamptz not null default now()
);
create index on public.suggestions (status, created_at desc);
create index on public.suggestions (user_id);
alter table public.suggestions enable row level security;

-- 회원은 내용만 쓸 수 있고(상태·메모는 못 건드림), 운영진은 상태·메모만 바꾼다
grant select on public.suggestions to authenticated;
grant insert (user_id, category, body) on public.suggestions to authenticated;
grant update (status, admin_note) on public.suggestions to authenticated;

create policy "suggestions: 본인 등록" on public.suggestions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "suggestions: 본인·운영진 조회" on public.suggestions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "suggestions: 운영진 처리" on public.suggestions for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
