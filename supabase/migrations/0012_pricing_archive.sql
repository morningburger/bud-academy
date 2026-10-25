-- 가격 표시 통일(필수 추가비용), 특강 트랙, 신청 대상 정리, 지난 초청 강의 아카이브

-- 1) 필수 추가비용 (교재비 등) — 총 결제금액 = price + extra_fee
alter table public.courses
  add column if not exists extra_fee integer check (extra_fee is null or extra_fee >= 0),
  add column if not exists extra_fee_label text;

-- 2) 특강 트랙 (촬영·보이스 트레이닝 등 기술 외 교육)
alter table public.courses drop constraint if exists courses_track_check;
alter table public.courses add constraint courses_track_check
  check (track in ('level', 'guest', 'brand', 'leadership', 'trend', 'special', 'etc'));

-- 3) 로레알 컬러키: 교재비를 총액에 포함, 사내 교육
update public.courses set
  extra_fee = 80000, extra_fee_label = '교재비', price_note = '4회 전체',
  internal_only = true, audience = '고정현헤어 디자이너',
  eligibility = '고정현헤어 소속 디자이너만 수강할 수 있어요.'
where title = '로레알 컬러키 4단계 과정';

-- 4) 최고관리자 양성과정: 사내 교육
update public.courses set
  internal_only = true, price_note = '4회 + 특강 전체',
  eligibility = '고정현헤어 관리자·리더만 수강할 수 있어요.'
where title = '고헤어 최고관리자 양성과정';

-- 5) 초청 원장 클래스: 고정현헤어·다른 살롱 모두 신청 가능
update public.courses set
  internal_only = false, audience = '헤어 디자이너 누구나',
  eligibility = '고정현헤어와 다른 살롱 디자이너 모두 신청할 수 있어요. 직급은 상관없어요.'
where track = 'guest' and status = 'published';

-- 6) 지난 초청 강의 (기존 사이트에서 진행한 교육) — 모집 마감 상태로 보관
with c as (
  insert into public.courses (is_official, track, format, status, sort_order, internal_only, title, summary, description,
    audience, price, price_note, location, schedule_summary, thumbnail_url, curriculum, published_at) values
  (true, 'guest', 'offline', 'closed', 200, false,
   '담다살롱 담이 원장 · 헤어어레인지',
   '밧줄 땋기부터 가시번·리본·트윈번까지, 살롱에서 바로 쓰는 헤어어레인지를 이론과 실습으로 배웠어요.',
   '강남·청담 살롱과 웨딩샵에서 10년 넘게 활동한 담다살롱 담이 원장의 헤어어레인지 교육이에요. 1차는 기본 땋기와 대표 스타일을 시연과 함께 익히고, 2차 실습반에서는 가시번 응용 패턴까지 직접 손으로 연습했어요.',
   '헤어 디자이너', 100000, '실습반 150,000원', '버드아카데미 3·4층',
   '2026년 8월 · 9월 · 2회',
   '/courses/c/guest-dami.webp',
   '[{"title":"밧줄 땋기 · 세 가닥 땋기 · 꼬아서 올리기"},{"title":"가시번 + 밧줄·리본 모양 스타일"},{"title":"양갈래 트윈번 스타일"},{"title":"실습반 · 기본 가시번 묶음머리, 리본 헤어"},{"title":"실습반 · 더블·볼륨 가시번 응용 패턴"}]'::jsonb,
   '2026-08-03'),
  (true, 'guest', 'offline', 'closed', 210, false,
   '로엔느 로와 대표원장 · 루미브라운 컬러',
   '염색 원리부터 웜·쿨 루미브라운 레시피 설계, 컬러 상담과 SNS 활용까지 다뤘어요.',
   '로엔느 로와 대표원장이 모발 구조와 색채 원리, 염모제·산화제 선택법을 정리하고 자신만의 루미브라운 레시피를 설계하는 법을 알려줬어요. 실패·성공 사례 분석과 컬러 포토슈팅까지 함께 진행했어요.',
   '헤어 디자이너', 70000, null, '버드아카데미 2층',
   '2026년 9월 7일(월) 08:00~11:30 · 1회',
   '/courses/c/guest-rowa.webp',
   '[{"title":"모발 구조와 염색·색채 원리"},{"title":"염모제·산화제 특성과 선택법"},{"title":"베이스·잔반사 진단과 레시피 설계"},{"title":"웜톤·쿨톤 루미브라운 분석"},{"title":"고객 상담과 컬러 제안법"},{"title":"컬러 포토슈팅 · SNS 활용"}]'::jsonb,
   '2026-08-14'),
  (true, 'guest', 'offline', 'closed', 220, false,
   '더 레이블 RK 원장 · 맨즈 커트&스타일링',
   '언더존·오버존 설계와 레이저 질감 컨트롤, 크롭 한 기장으로 네 가지 스타일을 만드는 법을 배웠어요.',
   '더 레이블 RK 원장이 다운펌한 듯한 핏을 만드는 언더존 커트, 레이저로 빠르게 완성하는 오버존 커트, 두상과 M자 라인을 보완하는 포인트 커트를 보여줬어요. 맨즈 고객 재방문율을 높이는 상담 노하우도 함께 다뤘어요.',
   '헤어 디자이너', 100000, null, '버드아카데미 2층',
   '2026년 8월 5일(수) 08:00~10:30 · 1회',
   '/courses/c/guest-rk.webp',
   '[{"title":"언더존 설계 · 다운펌 핏, 가짜 구레나룻, 네이프 페이드"},{"title":"오버존 설계 · 레이저 질감 컨트롤"},{"title":"포인트 커트로 두상·M자 라인 커버"},{"title":"크롭 한 기장으로 4가지 스타일"},{"title":"맨즈 고객 재방문 상담"}]'::jsonb,
   '2026-07-03'),
  (true, 'guest', 'offline', 'closed', 230, true,
   '에코쟈뎅 김보경 원장 · 캄 비스트 헤드스파',
   '캄 비스트 헤드스파를 살롱 현장에 안착시키기 위한 8주 과정을 두 기수로 진행했어요.',
   '에코쟈뎅 김보경 원장과 함께 헤드스파 프로세스를 8주 동안 익히는 과정이에요. 지점마다 같은 품질로 헤드스파를 제공할 수 있도록 매주 저녁 실습으로 진행했어요.',
   '고정현헤어 디자이너', 160000, '8회 전체', '버드아카데미',
   '2026년 3월 · 4월 · 기수별 8주',
   '/courses/c/guest-headspa.webp',
   '[{"title":"캄 비스트 헤드스파 프로세스"},{"title":"매주 저녁 실습 · 총 8주"}]'::jsonb,
   '2026-03-04'),
  (true, 'special', 'offline', 'closed', 240, true,
   '한용만 사진가 · 스마트폰 스타일 콘텐츠 촬영',
   '스마트폰으로 살롱 스타일 사진과 릴스를 찍고 보정하는 법을 배웠어요.',
   '그라피 매거진 사진디렉터 출신으로 밀본·시세이도·아모스 등의 트렌드 촬영을 맡아 온 한용만 사진가가 스마트폰 촬영 기초부터 인스타 릴스 만들기, 사진·영상 보정까지 실습으로 알려줬어요.',
   '고정현헤어 디자이너', 50000, '회차당', '버드아카데미',
   '2025년 10월 · 2026년 1월',
   '/courses/c/guest-hanyongman.webp',
   '[{"title":"스마트폰 촬영 기초 · 구도와 조명"},{"title":"인스타 릴스 만들기"},{"title":"사진·영상 촬영 실습과 후보정"}]'::jsonb,
   '2025-09-16'),
  (true, 'special', 'offline', 'closed', 250, true,
   '김세라 대표 · 목소리PT 보이스 파워 트레이닝',
   '전달력과 설득력을 높이는 발성·스피치를 3회에 걸쳐 훈련했어요.',
   '보이스 코치 경력 10년 이상의 목소리PT 김세라 대표가 고객 상담과 응대에 바로 쓰는 발성과 스피치를 코칭했어요. 인턴부터 관리자, 데스크 관리자까지 함께 들었어요.',
   '고정현헤어 구성원', 50000, '회차당', '버드아카데미 3층',
   '2025년 11월 · 12월 · 3회',
   '/courses/c/guest-kimsera.webp',
   '[{"title":"발성 교정 · 호흡과 공명"},{"title":"전달력 있는 스피치"},{"title":"상담·응대에 쓰는 말하기"}]'::jsonb,
   '2025-10-21')
  returning id, title
)
insert into public.course_instructors (course_id, instructor_id, role, position)
select c.id, i.id, null, 0
from c join public.instructors i on i.name = case
  when c.title like '담다살롱%' then '담이 원장'
  when c.title like '로엔느%' then '로와 대표원장'
  when c.title like '더 레이블%' then 'RK 원장'
  when c.title like '에코쟈뎅%' then '김보경 원장'
  when c.title like '한용만%' then '한용만 강사'
  when c.title like '김세라%' then '김세라 대표' end;

insert into public.course_sessions (course_id, label, starts_on, ends_on, schedule_text, location, status)
select c.id, v.label, v.s::date, v.e::date, v.t, v.loc, 'closed'
from public.courses c
join (values
  ('담다살롱%', '헤어어레인지 이론·시연', '2026-08-26', '2026-08-26', '08:00~10:00', '버드아카데미 3층'),
  ('담다살롱%', '헤어어레인지 실습반', '2026-09-23', '2026-09-23', '08:00~12:00', '버드아카데미 4층'),
  ('로엔느%', '9월 클래스', '2026-09-07', '2026-09-07', '08:00~11:30', '버드아카데미 2층'),
  ('더 레이블%', '8월 클래스', '2026-08-05', '2026-08-05', '08:00~10:30', '버드아카데미 2층'),
  ('에코쟈뎅%', '1기 · 화요일반', '2026-03-10', '2026-04-28', '매주 화 19:30~22:00 · 8회', '버드아카데미'),
  ('에코쟈뎅%', '2기 · 수요일반', '2026-04-08', '2026-05-27', '매주 수 19:30~22:00 · 8회', '버드아카데미'),
  ('한용만%', '1기', '2025-10-10', '2025-10-10', '1회', '버드아카데미'),
  ('한용만%', '2기', '2026-01-20', '2026-01-27', '화요일 · 2회', '버드아카데미'),
  ('김세라%', '3회 과정', '2025-11-18', '2025-12-16', '격주 화 08:00~10:00 (11/18 · 12/2 · 12/16)', '버드아카데미 3층')
) as v(pat, label, s, e, t, loc) on c.title like v.pat
where c.status = 'closed' and c.sort_order >= 200;
