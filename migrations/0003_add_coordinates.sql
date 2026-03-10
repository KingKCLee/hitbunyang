-- 분양 현장에 좌표 및 확장 필드 추가
ALTER TABLE properties ADD COLUMN lat REAL;
ALTER TABLE properties ADD COLUMN lng REAL;
ALTER TABLE properties ADD COLUMN share_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN phone_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN score INTEGER DEFAULT 0;

-- 구인 게시글에 좌표 추가
ALTER TABLE job_posts ADD COLUMN lat REAL;
ALTER TABLE job_posts ADD COLUMN lng REAL;
ALTER TABLE job_posts ADD COLUMN full_address TEXT;

-- 샘플 데이터에 좌표 업데이트 (실제 위도/경도)
UPDATE properties SET lat=37.3943, lng=127.1104, score=100 WHERE id=1; -- 판교역
UPDATE properties SET lat=37.5534, lng=127.1667, score=85 WHERE id=2;  -- 하남 미사
UPDATE properties SET lat=37.2001, lng=127.0748, score=92 WHERE id=3;  -- 동탄역
UPDATE properties SET lat=37.6028, lng=126.6886, score=71 WHERE id=4;  -- 검단
UPDATE properties SET lat=36.8151, lng=127.1139, score=78 WHERE id=5;  -- 천안 불당
UPDATE properties SET lat=35.1631, lng=129.1637, score=95 WHERE id=6;  -- 해운대
UPDATE properties SET lat=37.2639, lng=127.0286, score=65 WHERE id=7;  -- 광교

UPDATE job_posts SET lat=37.3943, lng=127.1104, full_address='경기도 성남시 분당구 판교역로 166' WHERE id=1;
UPDATE job_posts SET lat=37.5534, lng=127.1667, full_address='경기도 하남시 미사대로 520' WHERE id=2;
UPDATE job_posts SET lat=37.2001, lng=127.0748, full_address='경기도 화성시 동탄역로 160' WHERE id=3;
UPDATE job_posts SET lat=37.6028, lng=126.6886, full_address='인천광역시 서구 검단로 500' WHERE id=4;
UPDATE job_posts SET lat=36.8151, lng=127.1139, full_address='충청남도 천안시 서북구 불당호수로 100' WHERE id=5;
UPDATE job_posts SET lat=35.1631, lng=129.1637, full_address='부산광역시 해운대구 달맞이길 30' WHERE id=6;

-- AD 배너 슬라이더용 데이터 보강
INSERT OR IGNORE INTO banners (title, image_url, link_url, position, is_active, sort_order) VALUES
  ('[광고] 동탄역 GTX 아파트 팀장급 모집', '/static/images/ad1.jpg', '/jobs/3', 'slider', 1, 1),
  ('[광고] 프리미엄 현장 우선 배정 서비스', '/static/images/ad2.jpg', '/supporters', 'slider', 1, 2),
  ('[광고] 해운대 엘시티 레지던스 분양 진행중', '/static/images/ad3.jpg', '/properties/6', 'slider', 1, 3),
  ('[광고] 경기 판교 힐스테이트 특별 공급', '/static/images/ad4.jpg', '/properties/1', 'slider', 1, 4),
  ('[광고] 분양라인 기업회원 가입 혜택', '/static/images/ad5.jpg', '/register', 'slider', 1, 5),
  ('[광고] 천안 불당 자이 계약금 10%', '/static/images/ad6.jpg', '/properties/5', 'slider', 1, 6),
  ('[광고] 검단신도시 호반써밋 사전예약', '/static/images/ad7.jpg', '/properties/4', 'slider', 1, 7),
  ('[광고] 수원 광교 상가 수익형 투자', '/static/images/ad8.jpg', '/properties/7', 'slider', 1, 8);

-- 더 많은 샘플 현장 추가
INSERT OR IGNORE INTO properties (title, subtitle, property_type, region, address, lat, lng, price_min, price_max, supply_area_min, supply_area_max, total_units, floors, completion_date, sale_start_date, sale_end_date, description, status, is_featured, is_hot, is_new, ad_type, view_count, inquiry_count, score, contact_name, contact_phone, user_id) VALUES
  ('래미안 원펜타스', '서울 서초 랜드마크 아파트', 'apartment', '서울', '서울특별시 서초구 반포대로 304', 37.5045, 127.0199, 1200000000, 2500000000, 84.0, 132.0, 641, 35, '완공', '2024-10-01', '2025-12-31', '서초 반포 핵심 입지. 한강 조망 프리미엄 아파트.', 'active', 1, 1, 0, 'premium', 3200, 98, 150, '삼성물산 분양팀', '02-111-2222', 1),
  ('e편한세상 광진 그랜드파크', '광진구 자양동 대단지', 'apartment', '서울', '서울특별시 광진구 자양동 680', 37.5397, 127.0784, 780000000, 1200000000, 59.0, 84.0, 880, 33, '2026-05', '2025-03-01', '2025-04-30', '광진구 한강변 대단지. 뚝섬역 도보권.', 'active', 0, 1, 1, 'superior', 1450, 42, 110, 'DL이앤씨 분양', '02-222-3333', 1),
  ('힐스테이트 대구역 센트럴', '대구 대표 랜드마크', 'officetel', '경상', '대구광역시 북구 칠성남로 100', 35.8836, 128.5966, 280000000, 450000000, 33.0, 59.0, 720, 48, '2026-08', '2025-02-01', '2025-03-31', '대구역 도보 3분. 대구 도심 오피스텔.', 'active', 0, 0, 1, 'basic', 680, 25, 85, '현대건설 대구', '053-111-2222', 1),
  ('광주 수완 아이파크', '광주 수완지구 핵심 아파트', 'apartment', '전라', '광주광역시 광산구 수완동 1500', 35.1938, 126.8471, 260000000, 390000000, 59.0, 84.0, 540, 25, '2026-11', '2025-04-15', '2025-05-15', '수완지구 역세권 대단지. 실수요자 최적 입지.', 'upcoming', 0, 0, 1, 'none', 320, 14, 72, 'HDC 현대산업개발', '062-111-2222', 1),
  ('세종 리첸시아 파밀리에', '세종시 행복도시 프리미엄', 'apartment', '충청', '세종특별자치시 어진동 100', 36.4800, 127.2890, 310000000, 480000000, 59.0, 101.0, 680, 30, '2026-12', '2025-05-01', '2025-06-30', '세종 행복도시 핵심 입지. 정부청사 인접.', 'upcoming', 0, 1, 1, 'none', 445, 18, 88, '롯데건설 세종', '044-111-2222', 1),
  ('인천 청라 SK VIEW', '청라국제도시 프리미엄', 'apartment', '인천', '인천광역시 서구 청라동 1700', 37.5395, 126.6374, 380000000, 580000000, 59.0, 101.0, 1100, 38, '2027-06', '2025-06-01', '2025-07-31', '청라국제도시 대단지. 청라호수공원 도보권.', 'upcoming', 0, 0, 1, 'none', 290, 11, 68, 'SK건설 분양팀', '032-333-4444', 1);

-- 더 많은 구인 샘플
INSERT OR IGNORE INTO job_posts (title, site_name, region, property_type, rank_type, commission_rate, commission_note, daily_pay, accommodation_pay, experience_required, description, contact_name, contact_phone, is_hot, is_urgent, is_best, ad_type, view_count, status, lat, lng, user_id) VALUES
  ('[서울] 반포 래미안 팀장 모집 - 최고 수수료', '래미안 원펜타스', '서울', 'apartment', 'team_leader', 2.2, '계약건당 최대 2.2% (분양가 기준 최고 2,750만원)', 100000, 0, '서울 고가 아파트 경력 3년 이상 필수', '서초 반포 프리미엄 아파트 팀장 모집. 최고가 아파트 분양 경험자 우대.', '최본부장', '010-7777-8888', 1, 1, 1, 'premium', 678, 'active', 37.5045, 127.0199, 2),
  ('[경기] 광교 신도시 상가 분양 팀원', '수원 광교 상업시설', '경기', 'commercial', 'team_member', 1.3, '상가 분양가 1.3% 수수료', 45000, 0, '상가 분양 경력 6개월 이상', '광교 신도시 프라임 상가 분양. 안정적인 배후 수요.', '윤팀장', '010-8888-9999', 0, 0, 0, 'none', 145, 'active', 37.2639, 127.0286, 2),
  ('[부산] 해운대 레지던스 고수익 팀장', '부산 해운대 엘시티 레지던스', '부산', 'officetel', 'team_leader', 2.8, '건당 평균 수수료 2,200만원 이상 지급', 90000, 70000, '고급 레지던스 분양 경력자 필수', '해운대 초고층 럭셔리 레지던스. 건당 최고 수수료.', '박대표', '010-9999-0000', 1, 0, 1, 'superior', 412, 'active', 35.1631, 129.1637, 2),
  ('[충청] 세종시 아파트 신입 환영', '세종 리첸시아 파밀리에', '충청', 'apartment', 'team_member', 0.9, '신입 0.9%, 경력자 1.2% 협의', 30000, 35000, '신입 가능 (교육 제공)', '세종시 행복도시 아파트. 신입도 체계적 교육 후 현장 투입.', '강팀원', '010-0000-1111', 0, 0, 0, 'none', 98, 'active', 36.4800, 127.2890, 2);
