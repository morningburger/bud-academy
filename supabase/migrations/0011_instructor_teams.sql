-- 강사진 구분: 총괄 디렉터 / 트렌드팀 / 교육팀(내부), 외부 초청 강사는 team 없음. 노출 순서
alter table public.instructors
  add column team text check (team in ('director', 'trend', 'education')),
  add column sort_order integer not null default 100;

-- 팀·순서·소속은 관리자만 바꿀 수 있다
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
    new.team := null;
    new.sort_order := 100;
  else
    new.user_id := old.user_id;
    new.status := case when old.status = 'rejected' then 'pending' else old.status end; -- 반려 후 수정 시 재심사
    new.affiliation := old.affiliation;
    new.approved_at := old.approved_at;
    new.team := old.team;
    new.sort_order := old.sort_order;
  end if;
  return new;
end;
$$;

update public.instructors set team = 'education',
  sort_order = case name when '정권 부원장' then 10 when '장진섭 원장' then 11 when '지니 부원장' then 20 when '설현 부원장' then 21
    when '보라 부원장' then 30 when '수성 디자이너' then 31 when '하나 팀장' then 40 when '지유 실장' then 41 when '새벽 팀장' then 42 else 50 end
  where affiliation = 'gohair' and status = 'approved';

insert into public.instructors (name, headline, bio, career, branch_name, affiliation, status, team, sort_order, instagram, photo_url) values
('마스터 콴', '총괄 크리에이티브 디렉터',
 '고정현헤어 크리에이티브 디렉터이자 버드아카데미 교육 총괄. 매주 목요일 트렌드 커트&스타일 코스를 직접 이끌어요.',
 E'2003 영국 Vidal Sassoon salon internship\n2004–2005 영국 Golders Green TONI&GUY hair stylist\n2006–2009 LKJ trend collection & DVD chief director\n2006–2013 이가자헤어비스 trend hair show chief director, 아카데미 원장 및 art & education director\n2007 Wella Trend Vision Award big5 hair show director\n2008 L''ORÉAL trend shooting\n2012 온스타일 겟잇뷰티 프로페셔널 헤어팀\nWella Professional global artist\n(前) 아모스, 밀본, TIGI 등 프로페셔널 브랜드·아카데미 교육\n(現) 고정현헤어 Creative Director\n(現) 유튜브 채널 ‘MASTER KWAN’ 크리에이터',
 null, 'gohair', 'approved', 'director', 0, null, null),
('청하 부원장', '트렌드팀 · 트렌드 열펌', null, null, '청라1호점', 'gohair', 'approved', 'trend', 1, null, '/instructors/cheongha.webp'),
('혜린 부원장', '트렌드팀 · 트렌드 열펌', null, null, '서창점', 'gohair', 'approved', 'trend', 2, null, '/instructors/hyerin.webp'),
('재신 원장', '트렌드팀 · 트렌드 열펌', null, null, '검단신도시점', 'gohair', 'approved', 'trend', 3, null, '/instructors/jaesin.webp'),
('지윤 실장', '트렌드팀 · 트렌드 열펌', null, null, '부평점', 'gohair', 'approved', 'trend', 4, null, '/instructors/jiyun.webp'),
('우리 실장', '트렌드팀 · 트렌드 열펌', null, null, '인천논현점', 'gohair', 'approved', 'trend', 5, null, '/instructors/uri.webp'),
('효빈 팀장', '트렌드팀 · 트렌드 열펌', null, null, '메가스타영종점', 'gohair', 'approved', 'trend', 6, null, '/instructors/hyobin.webp');
