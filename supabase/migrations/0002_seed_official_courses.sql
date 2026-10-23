-- 버드아카데미 직영 강좌 초기 데이터 (가격·일정은 관리자 화면에서 채움)
insert into public.courses (is_official, category, format, title, summary, description, audience, status)
values
  (true, 'designer', 'offline', '디자이너 양성 과정',
   '인턴에서 디자이너로. 고정현헤어 현장 기준으로 커트·컬러·펌·상담까지 단계별로 배웁니다.',
   '고정현헤어 각 지점의 선배 디자이너가 직접 가르치는 정규 과정입니다. 기초 커트와 드라이부터 컬러, 펌, 고객 상담까지 현장에서 바로 쓰는 순서대로 진행하고, 단계마다 실습 평가를 거쳐 다음 단계로 넘어갑니다.',
   '인턴, 디자이너 데뷔를 준비하는 분', 'published'),
  (true, 'perm', 'offline', '열펌 과정',
   '디자이너 승급 후 듣는 열펌 집중 과정. 셋팅·매직·볼륨매직의 약제 선택과 열 조절을 다룹니다.',
   '디자이너로 승급한 뒤 매출을 끌어올리는 핵심 시술인 열펌을 집중적으로 다룹니다. 모질 진단, 약제 선택, 열 조절, 손상 관리까지 실제 고객 사례로 실습합니다.',
   '승급한 디자이너', 'published'),
  (true, 'trend', 'offline', '트렌드 코스',
   '크리에이티브 디렉터 마스터 콴과 함께 이번 시즌 스타일을 해석하고 직접 만들어 봅니다.',
   '매주 목요일 오전, 크리에이티브 디렉터 마스터 콴이 이번 시즌 트렌드 스타일을 시연하고 함께 재현합니다. 레퍼런스 분석부터 고객에게 제안하는 방법까지 다룹니다.',
   '디자이너', 'published'),
  (true, 'special', 'offline', '외부 강사 특강',
   '헤어 바깥의 시선. 마인드셋, 접객, 브랜딩 등 외부 전문가를 초청해 진행하는 특강입니다.',
   '살롱 운영과 디자이너 성장에 필요한 주제로 외부 전문가를 초청합니다. 특강마다 주제와 일정이 달라지니 회차 정보를 확인하세요.',
   '디자이너, 매니저, 원장', 'published');

insert into public.course_sessions (course_id, label, schedule_text, status)
select id, '정기 진행', '매주 목요일 오전', 'open' from public.courses where category = 'trend' and is_official;
