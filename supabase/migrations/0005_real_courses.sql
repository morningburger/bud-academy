-- 현재 운영 중인 버드아카데미(budacademy.co.kr) 강좌 구성을 옮겨온 데이터
-- 이미지는 사이트의 /public/courses, /public/instructors 에 있음

-- ── 강사 (계정 없이 관리자가 등록한 형태, 승인 상태) ──
insert into public.instructors (name, headline, branch_name, affiliation, status, photo_url, instagram) values
  ('보라 부원장',  'LV1 클리퍼 & 드라이',                 '송도센트럴점',   'gohair',   'approved', null, null),
  ('수성 디자이너', 'LV1 클리퍼 & 드라이',                 null,             'gohair',   'approved', null, null),
  ('새벽 팀장',    'LV1 펌 베이직 & 열펌',                 '청라1호점',      'gohair',   'approved', null, null),
  ('하나 팀장',    'LV1 펌 베이직 & 열펌',                 '검단신도시점',   'gohair',   'approved', null, null),
  ('지유 실장',    'LV1 펌 베이직 & 열펌',                 '일반교육부',     'gohair',   'approved', null, null),
  ('지니 부원장',  'LV2 베이직 헤어컷 & 드라이',           '스퀘어원1호점',  'gohair',   'approved', null, null),
  ('설현 부원장',  'LV2 응용 헤어컷',                      '송도오네스타점', 'gohair',   'approved', null, null),
  ('정권 부원장',  'LV3 디자인 헤어컷 & 마무리 드라이',    '부평블랙점',     'gohair',   'approved', '/instructors/jeonggwon.webp', null),
  ('장진섭 원장',  'LV3 디자인 헤어컷 & 마무리 드라이',    '부평점',         'gohair',   'approved', '/instructors/jangjinseop.webp', null),
  ('이용훈 원장',  '옴므드옴므 원장 · 남성 아이롱펌',      '옴므드옴므',     'external', 'approved', '/instructors/leeyonghoon.webp', 'yh.hommedehomme'),
  ('디큐 원장',    '홍대 아르결 원장 · 허쉬컷 & 허쉬펌',   '아르결',         'external', 'approved', '/instructors/dq.webp', 'a.rgyol_dq');

-- ── 기존 임시 직영 강좌 4개를 실제 과정으로 교체 ──
update public.courses set
  title = '버드 LV1 · 기초 실무 과정',
  track = 'level', level = 1, sort_order = 10,
  summary = '인턴의 첫 단계. 클리퍼·드라이와 펌 베이직·열펌을 반별로 나눠 매달 실습해요.',
  description = '고정현헤어에 막 합류한 인턴이 매장에서 바로 쓰는 기본기를 익히는 과정이에요. 클리퍼와 드라이, 펌 베이직과 열펌 이론실습 두 수업으로 나뉘고, 매달 여러 반으로 열려요. 지점 선배 디자이너들이 직접 가르칩니다.',
  audience = '고정현헤어 인턴',
  eligibility = '고정현헤어 소속 인턴만 수강할 수 있어요. 다른 살롱 소속은 신청할 수 없어요.',
  price = 0, location = '버드아카데미 2층',
  schedule_summary = '매달 반별 진행 · 08:30 시작',
  thumbnail_url = '/courses/lv1-clipper.webp',
  gallery = array['/courses/lv1-perm.webp'],
  curriculum = '[
    {"title": "클리퍼 & 드라이", "detail": "보라 부원장 · 수성 디자이너 / 08:30~12:00"},
    {"title": "펌 베이직 & 열펌 이론실습", "detail": "새벽 팀장 · 하나 팀장 · 지유 실장 / 08:30~11:30"}
  ]'::jsonb
where is_official and title = '디자이너 양성 과정';

update public.courses set
  title = '버드 LV2 · 헤어컷 기본과 응용',
  track = 'level', level = 2, sort_order = 20,
  summary = '베이직 헤어컷과 드라이를 다지고, 응용 헤어컷으로 디자인의 폭을 넓혀요.',
  description = 'LV1을 마친 인턴이 헤어컷의 기본 구조를 몸에 익히는 단계예요. 베이직 헤어컷과 드라이로 형태를 잡는 법을 배운 뒤, 응용 헤어컷으로 고객별 디자인을 만드는 연습을 합니다.',
  audience = 'LV1을 마친 고정현헤어 인턴',
  eligibility = '고정현헤어 소속 인턴만 수강할 수 있어요. 다른 살롱 소속은 신청할 수 없어요.',
  price = 0, location = '버드아카데미 2층',
  schedule_summary = '매달 진행 · 금요일 / 화요일',
  thumbnail_url = '/courses/lv2.webp',
  gallery = '{}',
  curriculum = '[
    {"title": "베이직 헤어컷 & 드라이", "detail": "지니 부원장 / 금요일 08:30~11:30"},
    {"title": "응용 헤어컷", "detail": "설현 부원장 / 화요일 08:30~12:30"}
  ]'::jsonb
where is_official and title = '열펌 과정';

update public.courses set
  title = '버드 LV3 · 디자인 헤어컷 & 마무리 드라이',
  track = 'level', level = 3, sort_order = 30,
  summary = '디자이너 데뷔 직전 단계. 디자인 헤어컷과 완성도를 결정하는 마무리 드라이를 배워요.',
  description = '디자이너 승급을 앞둔 인턴을 위한 마지막 단계예요. 디자인 헤어컷과 마무리 드라이까지 한 번에 완성하는 흐름을 원장·부원장이 직접 가르칩니다. 수요일반과 목요일반 중 선택할 수 있어요.',
  audience = 'LV2를 마친 고정현헤어 인턴',
  eligibility = '고정현헤어 소속 인턴만 수강할 수 있어요. 다른 살롱 소속은 신청할 수 없어요.',
  price = 0, location = '버드아카데미 2층 · 4층',
  schedule_summary = '매달 진행 · 수요일반 / 목요일반 · 08:30~13:30',
  thumbnail_url = '/courses/lv3-jeonggwon.webp',
  gallery = array['/courses/lv3-jangjinseop.webp'],
  curriculum = '[
    {"title": "1반 (수요일)", "detail": "정권 부원장 / 08:30~13:30 / 2층"},
    {"title": "2반 (목요일)", "detail": "장진섭 원장 / 08:30~13:30 / 4층"}
  ]'::jsonb
where is_official and title = '트렌드 코스';

update public.courses set
  title = '고헤어 최고관리자 양성과정',
  track = 'leadership', level = null, sort_order = 70,
  summary = '살롱을 이끄는 리더의 역량을 4일 동안 집중해서 키우는 과정이에요. 총 27시간.',
  description = '리더십의 기초부터 코칭 대화, 팀 동기부여, 현장 적용까지 4일에 걸쳐 다뤄요. 격주 화요일에 진행하고, 마지막 회차는 특강으로 마무리합니다.',
  audience = '고정현헤어 관리자·리더',
  eligibility = null,
  price = 300000, location = '버드아카데미 3층',
  schedule_summary = '격주 화요일 · 4회 + 특강 · 오전 9시',
  thumbnail_url = '/courses/leadership-poster.webp',
  gallery = array['/courses/leadership-poster.webp'],
  curriculum = '[
    {"title": "DAY 1 · 리더로서 나를 세우다", "detail": "살롱 리더십의 기초와 영향력, 마인드셋 / 7시간"},
    {"title": "DAY 2 · 관계와 신뢰를 이끌다", "detail": "코칭 대화와 갈등관리 스킬 / 7시간"},
    {"title": "DAY 3 · 팀과 함께 성장하다", "detail": "강점, 비전, 동기부여 / 7시간"},
    {"title": "DAY 4 · 현장에 적용하다", "detail": "이해관계자 관리와 실행 다짐 / 6시간"}
  ]'::jsonb
where is_official and title = '외부 강사 특강';

-- ── 초청 원장 클래스 · 브랜드 교육 ──
insert into public.courses (is_official, track, format, status, sort_order, title, summary, description, audience, eligibility,
  price, price_note, location, schedule_summary, thumbnail_url, gallery, materials, curriculum) values
  (true, 'guest', 'offline', 'published', 40,
   '옴므드옴므 이용훈 원장 · 남성 아이롱펌',
   '퀵 스피드 맨즈 컷부터 아이롱펌 뿌리볼륨·한바퀴·슬라이딩 테크닉까지 하루에 배워요.',
   '남성 펌 전문 살롱 옴므드옴므의 이용훈 원장이 1:1 시술에 맞춘 트렌드 맨즈 컷과 아이롱펌 테크닉을 직접 시연하고 알려줘요.',
   '고정현헤어 디자이너', '고정현헤어 디자이너라면 직급 상관없이 신청할 수 있어요.',
   100000, null, '버드아카데미 2층', '11월 3일(화) 08:00~11:00 · 1회',
   '/courses/guest-iron-perm.webp', array['/courses/guest-iron-perm-styles.webp'], '{}',
   '[
     {"title": "1:1 시술에 맞춘 퀵 스피드 트렌드 맨즈 컷"},
     {"title": "아이롱펌 뿌리볼륨 테크닉"},
     {"title": "아이롱펌 한바퀴 테크닉"},
     {"title": "아이롱펌 슬라이딩 테크닉"},
     {"title": "연모 아이롱펌 노하우"}
   ]'::jsonb),
  (true, 'guest', 'offline', 'published', 50,
   '아르결 디큐 원장 · 허쉬컷 & 허쉬펌',
   '롱·미디엄 허쉬컷 실습과 시연, 허쉬펌 응용, 포토슈팅까지 4시간 집중 클래스예요.',
   '홍대 아르결의 디큐 원장이 허쉬컷의 길이별 구조와 스타일링, 허쉬펌 응용법을 보여주고 마지막에 포토슈팅까지 진행해요. 가발과 도구를 꼭 챙겨 오세요.',
   '고정현헤어 디자이너', '고정현헤어 디자이너라면 직급 상관없이 신청할 수 있어요.',
   200000, null, '버드아카데미 2층', '12월 1일(화) 08:00~12:00 · 1회',
   '/courses/guest-hush.webp', array['/courses/guest-hush-styles.webp'],
   array['미용도구 (블런트·틴닝·슬라이싱 가위 포함)', '가발 (가슴선 이상 길이)', '38mm 정도 아이롱, 매직기, 뿌리롤'],
   '[
     {"title": "롱 허쉬컷 실습 · 스타일링"},
     {"title": "미디엄 허쉬컷 시연"},
     {"title": "허쉬컷 펌 응용 (설명)"},
     {"title": "포토슈팅"}
   ]'::jsonb),
  (true, 'brand', 'hybrid', 'published', 60,
   '로레알 컬러키 4단계 과정',
   '로레알 프로페셔널의 컬러 교육. 염색 이론부터 톤다운·백모커버까지 4회에 나눠 배워요.',
   '로레알 프로페셔널 컬러키 커리큘럼을 4주 동안 단계별로 진행해요. 1회차 이론은 온라인(Teams)으로, 2~4회차는 버드아카데미에서 실습합니다. 교육비는 4회 전체 기준이에요.',
   '디자이너', null,
   100000, '교재비 8만원 별도', '버드아카데미 4층 (1회차 온라인)', '매주 목요일 10:00~16:00 · 4회',
   '/courses/loreal-colorkey.webp', array['/courses/loreal-colorkey-curriculum.webp'], '{}',
   '[
     {"title": "1단계 · 염색의 기본 이론", "detail": "11월 26일(목) · 온라인 Teams"},
     {"title": "2단계 · 마지패션의 활용 방법", "detail": "12월 3일(목)"},
     {"title": "3단계 · 컬러 체인지", "detail": "12월 10일(목)"},
     {"title": "4단계 · 톤다운 & 백모커버", "detail": "12월 17일(목)"}
   ]'::jsonb);

-- ── 회차 ──
-- 기존 '정기 진행' 회차(트렌드 코스용)를 LV3 1반으로 재사용
update public.course_sessions s set
  label = '10월 1반 · 수요일', schedule_text = '08:30~13:30 · 정권 부원장', location = '버드아카데미 2층', status = 'closed'
from public.courses c where s.course_id = c.id and c.title = '버드 LV3 · 디자인 헤어컷 & 마무리 드라이';

insert into public.course_sessions (course_id, label, starts_on, ends_on, schedule_text, location, capacity, status)
select c.id, v.label, v.starts_on::date, v.ends_on::date, v.schedule_text, v.location, v.capacity, v.status
from (values
  ('버드 LV1 · 기초 실무 과정', '10월 1반 · 클리퍼 & 드라이', null, null, '08:30~12:00 · 보라 부원장 · 수성 디자이너', '버드아카데미 2층', null::int, 'closed'),
  ('버드 LV1 · 기초 실무 과정', '10월 2반 · 클리퍼 & 드라이', null, null, '08:30~12:00 · 보라 부원장 · 수성 디자이너', '버드아카데미 2층', null, 'closed'),
  ('버드 LV1 · 기초 실무 과정', '10월 3반 · 클리퍼 & 드라이', null, null, '08:30~12:00 · 보라 부원장 · 수성 디자이너', '버드아카데미 2층', null, 'closed'),
  ('버드 LV1 · 기초 실무 과정', '10월 1반 · 펌 베이직 & 열펌', null, null, '08:30~11:30 · 새벽 팀장 · 하나 팀장 · 지유 실장', '버드아카데미 2층', null, 'closed'),
  ('버드 LV1 · 기초 실무 과정', '10월 2반 · 펌 베이직 & 열펌', null, null, '08:30~11:30 · 새벽 팀장 · 하나 팀장 · 지유 실장', '버드아카데미 2층', null, 'closed'),
  ('버드 LV2 · 헤어컷 기본과 응용', '10월 · 베이직 헤어컷 & 드라이', null, null, '금요일 08:30~11:30 · 지니 부원장', '버드아카데미 2층', null, 'closed'),
  ('버드 LV2 · 헤어컷 기본과 응용', '10월 · 응용 헤어컷', null, null, '화요일 08:30~12:30 · 설현 부원장', '버드아카데미 2층', null, 'closed'),
  ('버드 LV3 · 디자인 헤어컷 & 마무리 드라이', '10월 2반 · 목요일', null, null, '08:30~13:30 · 장진섭 원장', '버드아카데미 4층', null, 'closed'),
  ('옴므드옴므 이용훈 원장 · 남성 아이롱펌', '11월 클래스', '2026-11-03', '2026-11-03', '08:00~11:00', '버드아카데미 2층', 30, 'open'),
  ('아르결 디큐 원장 · 허쉬컷 & 허쉬펌', '12월 클래스', '2026-12-01', '2026-12-01', '08:00~12:00', '버드아카데미 2층', 20, 'open'),
  ('로레알 컬러키 4단계 과정', '4회 과정', '2026-11-26', '2026-12-17', '매주 목 10:00~16:00 (11/26 · 12/3 · 12/10 · 12/17)', '버드아카데미 4층', 25, 'open'),
  ('고헤어 최고관리자 양성과정', '하반기 과정', '2026-10-13', '2026-12-08', '격주 화 09:00~ (10/13 · 10/27 · 11/10 · 11/24 · 12/8 특강)', '버드아카데미 3층', 40, 'closed')
) as v(course_title, label, starts_on, ends_on, schedule_text, location, capacity, status)
join public.courses c on c.title = v.course_title and c.is_official;

-- ── 강사진 연결 ──
insert into public.course_instructors (course_id, instructor_id, role, position)
select c.id, i.id, v.role, v.pos
from (values
  ('버드 LV1 · 기초 실무 과정', '보라 부원장', '클리퍼 & 드라이', 1),
  ('버드 LV1 · 기초 실무 과정', '수성 디자이너', '클리퍼 & 드라이', 2),
  ('버드 LV1 · 기초 실무 과정', '새벽 팀장', '펌 베이직 & 열펌', 3),
  ('버드 LV1 · 기초 실무 과정', '하나 팀장', '펌 베이직 & 열펌', 4),
  ('버드 LV1 · 기초 실무 과정', '지유 실장', '펌 베이직 & 열펌', 5),
  ('버드 LV2 · 헤어컷 기본과 응용', '지니 부원장', '베이직 헤어컷 & 드라이', 1),
  ('버드 LV2 · 헤어컷 기본과 응용', '설현 부원장', '응용 헤어컷', 2),
  ('버드 LV3 · 디자인 헤어컷 & 마무리 드라이', '정권 부원장', '1반 · 수요일', 1),
  ('버드 LV3 · 디자인 헤어컷 & 마무리 드라이', '장진섭 원장', '2반 · 목요일', 2),
  ('옴므드옴므 이용훈 원장 · 남성 아이롱펌', '이용훈 원장', '초청 강사', 1),
  ('아르결 디큐 원장 · 허쉬컷 & 허쉬펌', '디큐 원장', '초청 강사', 1)
) as v(course_title, instructor_name, role, pos)
join public.courses c on c.title = v.course_title and c.is_official
join public.instructors i on i.name = v.instructor_name and i.user_id is null;

-- 리더십 과정 대표 이미지는 포스터 상단을 가로로 자른 버전 사용
update public.courses set thumbnail_url = '/courses/leadership-cover.webp' where title = '고헤어 최고관리자 양성과정';
